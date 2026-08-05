-- 0029_kis_identity_system.sql
-- KIS — Kuteka Identity System (transversal)
-- Evolui PRD-009 / ADR-014: OCR/liveness prep, histórico, UTS, gates Pay, auditoria docs.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Colunas de preparação (OCR, prova de vida, encriptação documental)
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.identity_id_documents
  add column if not exists ocr_status text not null default 'none'
    check (ocr_status in ('none', 'queued', 'processed', 'failed')),
  add column if not exists ocr_payload jsonb not null default '{}'::jsonb,
  add column if not exists ocr_processed_at timestamptz,
  add column if not exists encryption_scheme text not null default 'storage_private_bucket_v1',
  add column if not exists expires_notified_at timestamptz;

comment on column public.identity_id_documents.ocr_status is
  'Prep para OCR/IA — none até activar pipeline.';
comment on column public.identity_id_documents.encryption_scheme is
  'Esquema de protecção: bucket privado + RLS; evolução futura para envelope encryption.';

alter table public.profiles
  add column if not exists liveness_status text not null default 'none'
    check (liveness_status in ('none', 'pending', 'passed', 'failed')),
  add column if not exists liveness_checked_at timestamptz,
  add column if not exists kis_completeness numeric(5, 2) not null default 0
    check (kis_completeness between 0 and 100),
  add column if not exists kyc_photo_status text not null default 'missing'
    check (kyc_photo_status in ('missing', 'pending', 'verified', 'rejected'));

comment on column public.profiles.trust_index is
  'UTS — User Trust Score (0–100). Usado pelo KAI para risco.';
comment on column public.profiles.kis_completeness is
  'Percentagem de preenchimento do KIS (assistente de onboarding).';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Histórico de alterações de campos sensíveis
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.identity_field_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  actor_id uuid references public.profiles (id),
  field_name text not null,
  old_value text,
  new_value text,
  entity_type text not null default 'profile',
  entity_id text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists identity_field_changes_user_idx
  on public.identity_field_changes (user_id, created_at desc);

alter table public.identity_field_changes enable row level security;

drop policy if exists identity_field_changes_select on public.identity_field_changes;
create policy identity_field_changes_select on public.identity_field_changes
  for select to authenticated
  using (
    user_id = auth.uid()
    or actor_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'admin.panel')
  );

-- Sem insert directo do cliente — só via trigger / security definer

create or replace function public.log_identity_field_change(
  p_user_id uuid,
  p_field text,
  p_old text,
  p_new text,
  p_entity_type text default 'profile',
  p_entity_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_old is not distinct from p_new then
    return;
  end if;
  insert into public.identity_field_changes (
    user_id, actor_id, field_name, old_value, new_value, entity_type, entity_id
  ) values (
    p_user_id, auth.uid(), p_field, p_old, p_new, p_entity_type, p_entity_id
  );
end;
$$;

revoke all on function public.log_identity_field_change(uuid, text, text, text, text, text) from public;
grant execute on function public.log_identity_field_change(uuid, text, text, text, text, text) to authenticated;

create or replace function public.trg_profiles_identity_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.log_identity_field_change(new.id, 'legal_full_name', old.legal_full_name, new.legal_full_name);
  perform public.log_identity_field_change(new.id, 'preferred_name', old.preferred_name, new.preferred_name);
  perform public.log_identity_field_change(new.id, 'sex', old.sex, new.sex);
  perform public.log_identity_field_change(new.id, 'birth_date', old.birth_date::text, new.birth_date::text);
  perform public.log_identity_field_change(new.id, 'nationality', old.nationality, new.nationality);
  perform public.log_identity_field_change(new.id, 'place_of_birth', old.place_of_birth, new.place_of_birth);
  perform public.log_identity_field_change(new.id, 'marital_status', old.marital_status, new.marital_status);
  perform public.log_identity_field_change(new.id, 'phone_primary', old.phone_primary, new.phone_primary);
  perform public.log_identity_field_change(new.id, 'email_secondary', old.email_secondary, new.email_secondary);
  return new;
end;
$$;

drop trigger if exists trg_profiles_identity_history on public.profiles;
create trigger trg_profiles_identity_history
  after update on public.profiles
  for each row
  execute function public.trg_profiles_identity_history();

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Auditoria de consulta a documentos + listagem do próprio histórico
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.log_identity_document_view(
  p_document_id uuid,
  p_side text default 'meta'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_owner uuid;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select user_id into v_owner
  from public.identity_id_documents
  where id = p_document_id and deleted_at is null;

  if v_owner is null then
    raise exception 'document not found';
  end if;

  if v_actor is distinct from v_owner
     and not public.user_has_permission(v_actor, 'admin.panel')
     and not public.user_has_permission(v_actor, 'agent.operate') then
    raise exception 'forbidden';
  end if;

  insert into public.identity_access_logs (
    actor_id, subject_user_id, action, entity_type, entity_id, metadata
  ) values (
    v_actor, v_owner, 'identity.document_viewed', 'identity_id_document',
    p_document_id::text,
    jsonb_build_object('side', coalesce(p_side, 'meta'))
  );
end;
$$;

revoke all on function public.log_identity_document_view(uuid, text) from public;
grant execute on function public.log_identity_document_view(uuid, text) to authenticated;

create or replace function public.list_my_identity_changes(p_limit int default 50)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  return coalesce(
    (
      select jsonb_agg(row_to_json(t)::jsonb order by t.created_at desc)
      from (
        select id, field_name, old_value, new_value, entity_type, created_at
        from public.identity_field_changes
        where user_id = v_actor
        order by created_at desc
        limit greatest(1, least(coalesce(p_limit, 50), 200))
      ) t
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.list_my_identity_changes(int) from public;
grant execute on function public.list_my_identity_changes(int) to authenticated;

create or replace function public.list_my_identity_access_logs(p_limit int default 50)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  return coalesce(
    (
      select jsonb_agg(row_to_json(t)::jsonb order by t.created_at desc)
      from (
        select id, actor_id, action, entity_type, entity_id, metadata, created_at
        from public.identity_access_logs
        where subject_user_id = v_actor
        order by created_at desc
        limit greatest(1, least(coalesce(p_limit, 50), 200))
      ) t
    ),
    '[]'::jsonb
  );
end;
$$;

revoke all on function public.list_my_identity_access_logs(int) from public;
grant execute on function public.list_my_identity_access_logs(int) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Documentos expirados
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.mark_expired_identity_documents()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_count int := 0;
  r record;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not (
    public.user_has_permission(v_actor, 'admin.panel')
    or public.user_has_permission(v_actor, 'finance.manage')
  ) then
    raise exception 'admin.panel or finance.manage required';
  end if;

  for r in
    select id, user_id
    from public.identity_id_documents
    where deleted_at is null
      and status = 'accepted'
      and expires_on is not null
      and expires_on < (timezone('utc', now()))::date
  loop
    update public.identity_id_documents
    set status = 'expired',
        updated_by = v_actor,
        expires_notified_at = coalesce(expires_notified_at, timezone('utc', now()))
    where id = r.id;
    perform public.recompute_profile_kyc(r.user_id);
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('ok', true, 'expiredCount', v_count);
end;
$$;

revoke all on function public.mark_expired_identity_documents() from public;
grant execute on function public.mark_expired_identity_documents() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. Completude KIS + recompute estendido (UTS + foto)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.compute_kis_completeness(p_user_id uuid)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_score numeric := 0;
  v_profile public.profiles%rowtype;
  v_email_ok boolean := false;
  v_has_doc boolean := false;
  v_has_addr boolean := false;
  v_has_bank boolean := false;
begin
  select * into v_profile from public.profiles where id = p_user_id and deleted_at is null;
  if not found then
    return 0;
  end if;

  select u.email_confirmed_at is not null into v_email_ok
  from auth.users u where u.id = p_user_id;

  if v_email_ok then v_score := v_score + 12; end if;
  if v_profile.phone_primary is not null then v_score := v_score + 8; end if;
  if v_profile.phone_verified_at is not null then v_score := v_score + 5; end if;
  if v_profile.legal_full_name is not null and length(trim(v_profile.legal_full_name)) >= 3 then
    v_score := v_score + 12;
  end if;
  if v_profile.birth_date is not null then v_score := v_score + 6; end if;
  if v_profile.nationality is not null then v_score := v_score + 5; end if;
  if v_profile.sex is not null then v_score := v_score + 3; end if;
  if v_profile.place_of_birth is not null then v_score := v_score + 3; end if;
  if v_profile.marital_status is not null then v_score := v_score + 3; end if;
  if v_profile.avatar_url is not null then v_score := v_score + 8; end if;
  if v_profile.selfie_url is not null then v_score := v_score + 4; end if;

  select exists (
    select 1 from public.identity_id_documents d
    where d.user_id = p_user_id and d.deleted_at is null
      and d.front_storage_path is not null and d.back_storage_path is not null
  ) into v_has_doc;
  if v_has_doc then v_score := v_score + 15; end if;

  select exists (
    select 1 from public.identity_addresses a
    where a.user_id = p_user_id and a.deleted_at is null
      and a.province is not null and a.municipality is not null
  ) into v_has_addr;
  if v_has_addr then v_score := v_score + 10; end if;

  select exists (
    select 1 from public.identity_banking b
    where b.user_id = p_user_id and b.deleted_at is null
      and (b.iban is not null or b.account_number is not null)
  ) into v_has_bank;
  if v_has_bank then v_score := v_score + 6; end if;

  if v_score > 100 then v_score := 100; end if;
  return round(v_score, 2);
end;
$$;

revoke all on function public.compute_kis_completeness(uuid) from public;
grant execute on function public.compute_kis_completeness(uuid) to authenticated;

-- Extend recompute to set kis_completeness + kyc_photo_status
create or replace function public.recompute_profile_kyc(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_email_confirmed boolean := false;
  v_phone_ok boolean := false;
  v_has_personal boolean := false;
  v_doc_status text := 'missing';
  v_addr_status text := 'missing';
  v_bank_status text := 'missing';
  v_photo_status text := 'missing';
  v_level int := 0;
  v_index numeric(5, 2) := 0;
  v_identity_ok boolean := false;
  v_completeness numeric(5, 2) := 0;
begin
  select * into v_profile
  from public.profiles
  where id = p_user_id and deleted_at is null;

  if not found then
    return;
  end if;

  select u.email_confirmed_at is not null
  into v_email_confirmed
  from auth.users u
  where u.id = p_user_id;

  v_phone_ok := v_profile.phone_verified_at is not null
    and v_profile.phone_primary is not null
    and length(trim(v_profile.phone_primary)) >= 8;

  v_has_personal :=
    v_profile.legal_full_name is not null
    and length(trim(v_profile.legal_full_name)) >= 3
    and v_profile.birth_date is not null
    and v_profile.nationality is not null
    and length(trim(v_profile.nationality)) >= 2;

  if v_profile.avatar_url is not null then
    v_photo_status := 'verified';
  elsif v_profile.selfie_url is not null then
    v_photo_status := 'pending';
  else
    v_photo_status := 'missing';
  end if;

  select coalesce(
    (
      select case d.status
        when 'accepted' then 'verified'
        when 'under_review' then 'pending'
        when 'submitted' then 'pending'
        when 'rejected' then 'rejected'
        when 'expired' then 'rejected'
        else 'missing'
      end
      from public.identity_id_documents d
      where d.user_id = p_user_id
        and d.deleted_at is null
      order by
        case d.status
          when 'accepted' then 0
          when 'under_review' then 1
          when 'submitted' then 2
          when 'rejected' then 3
          else 4
        end,
        d.created_at desc
      limit 1
    ),
    'missing'
  )
  into v_doc_status;

  select coalesce(
    (
      select case a.verification_status
        when 'verified' then 'verified'
        when 'submitted' then 'pending'
        when 'rejected' then 'rejected'
        else 'missing'
      end
      from public.identity_addresses a
      where a.user_id = p_user_id
        and a.deleted_at is null
      limit 1
    ),
    'missing'
  )
  into v_addr_status;

  if v_addr_status = 'missing' and exists (
    select 1
    from public.identity_addresses a
    where a.user_id = p_user_id
      and a.deleted_at is null
      and a.province is not null
      and a.municipality is not null
  ) then
    v_addr_status := 'pending';
  end if;

  select coalesce(
    (
      select case b.verification_status
        when 'verified' then 'verified'
        when 'submitted' then 'pending'
        when 'rejected' then 'rejected'
        else 'missing'
      end
      from public.identity_banking b
      where b.user_id = p_user_id
        and b.deleted_at is null
        and (
          b.iban is not null
          or b.account_number is not null
          or jsonb_array_length(coalesce(b.digital_wallets, '[]'::jsonb)) > 0
        )
      limit 1
    ),
    'missing'
  )
  into v_bank_status;

  v_identity_ok := v_has_personal and v_doc_status = 'verified';

  v_level := 0;
  if v_email_confirmed then
    v_level := 1;
  end if;

  if v_doc_status = 'verified' then
    v_level := greatest(v_level, 2);
  end if;

  if v_identity_ok and v_addr_status in ('pending', 'verified') then
    v_level := greatest(v_level, 3);
  end if;

  if v_level >= 3
     and v_addr_status = 'verified'
     and v_bank_status in ('pending', 'verified') then
    v_level := 4;
  end if;

  v_index := 0;
  if v_email_confirmed then v_index := v_index + 15; end if;
  if v_phone_ok then v_index := v_index + 15; end if;
  if v_has_personal then v_index := v_index + 20; end if;
  if v_doc_status = 'pending' then v_index := v_index + 10; end if;
  if v_doc_status = 'verified' then v_index := v_index + 25; end if;
  if v_addr_status = 'pending' then v_index := v_index + 5; end if;
  if v_addr_status = 'verified' then v_index := v_index + 15; end if;
  if v_bank_status = 'pending' then v_index := v_index + 3; end if;
  if v_bank_status = 'verified' then v_index := v_index + 10; end if;
  if v_profile.avatar_url is not null then v_index := v_index + 5; end if;
  if v_index > 100 then v_index := 100; end if;

  v_completeness := public.compute_kis_completeness(p_user_id);

  update public.profiles
  set kyc_level = v_level,
      kyc_identity_status = case
        when v_identity_ok then 'verified'
        when v_has_personal and v_doc_status = 'pending' then 'pending'
        when v_has_personal then 'pending'
        else 'missing'
      end,
      kyc_document_status = v_doc_status,
      kyc_address_status = v_addr_status,
      kyc_banking_status = v_bank_status,
      kyc_photo_status = v_photo_status,
      trust_index = v_index,
      kis_completeness = v_completeness,
      identity_updated_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = p_user_id;
end;
$$;

revoke all on function public.recompute_profile_kyc(uuid) from public;
grant execute on function public.recompute_profile_kyc(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Gate KYC transversal + Kuteka Pay
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.assert_actor_meets_kyc(p_min_level int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  -- Super / finance ops podem operar em nome do sistema (sandbox / admin)
  if public.user_has_permission(v_actor, 'finance.manage')
     or public.user_has_permission(v_actor, 'admin.panel') then
    return;
  end if;

  if not public.user_meets_kyc_level(v_actor, p_min_level) then
    raise exception 'identity verification required (KYC level %)', p_min_level
      using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.assert_actor_meets_kyc(int) from public;
grant execute on function public.assert_actor_meets_kyc(int) to authenticated;

create or replace function public.kis_min_level_for_action(p_action text)
returns int
language sql
immutable
as $$
  select case lower(trim(p_action))
    when 'browse' then 0
    when 'explore' then 0
    when 'contract' then 2
    when 'payment' then 2
    when 'reservation' then 2
    when 'visit' then 2
    when 'purchase' then 2
    when 'sale' then 2
    when 'rent' then 2
    when 'service' then 2
    when 'marketplace' then 2
    when 'smart_move' then 2
    when 'find_home' then 2
    when 'concierge' then 2
    when 'garantia' then 2
    when 'assistencia' then 2
    when 'partner_publish' then 2
    when 'agent_operate' then 2
    else 2
  end;
$$;

revoke all on function public.kis_min_level_for_action(text) from public;
grant execute on function public.kis_min_level_for_action(text) to authenticated;

-- Reinject KYC gate into Kuteka Pay (assinatura actual com amount_override)
create or replace function public.kuteka_pay_create_intent(
  p_product_code text,
  p_module_code text default 'other',
  p_purpose text default null,
  p_reference_type text default null,
  p_reference_id uuid default null,
  p_urgency_band text default null,
  p_gateway_code text default null,
  p_idempotency_key text default null,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_amount_override numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_quote jsonb;
  v_intent public.finance_payment_intents%rowtype;
  v_intent_id uuid;
  v_ledger_id uuid;
  v_amount numeric(14, 2);
  v_currency text;
  v_product_id uuid;
  v_rule_id uuid;
  v_gateway public.finance_gateways%rowtype;
  v_module text := coalesce(nullif(trim(p_module_code), ''), 'other');
  v_key text := nullif(trim(p_idempotency_key), '');
  v_override numeric(14, 2) := case
    when p_amount_override is not null and p_amount_override >= 0
    then round(p_amount_override, 2) else null end;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  -- KIS: pagamentos comerciais exigem KYC ≥ 2 (excepto finance.manage / admin)
  perform public.assert_actor_meets_kyc(2);

  if v_key is not null then
    select * into v_intent
    from public.finance_payment_intents
    where idempotency_key = v_key;
    if found then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'paymentIntentId', v_intent.id,
        'amount', v_intent.amount,
        'currency', v_intent.currency,
        'gateway', v_intent.gateway_code,
        'adapterCode', v_intent.adapter_code,
        'sandbox', v_intent.sandbox,
        'status', v_intent.status,
        'moduleCode', v_intent.module_code,
        'purpose', v_intent.purpose,
        'quote', v_intent.quote_snapshot,
        'clientAction', case
          when v_intent.status = 'succeeded' then jsonb_build_object('type', 'already_captured')
          when v_intent.sandbox then jsonb_build_object('type', 'auto_capture_ready')
          else jsonb_build_object('type', 'gateway_redirect', 'gatewayCode', v_intent.gateway_code)
        end
      );
    end if;
  end if;

  v_quote := public.finance_quote_price(p_product_code, p_urgency_band, 'AO', 'AOA');
  if coalesce((v_quote->>'ok')::boolean, false) is not true then
    raise exception 'unable to quote product %', p_product_code;
  end if;

  v_amount := coalesce((v_quote->>'amount')::numeric, 0);
  v_currency := coalesce(v_quote->>'currency', 'AOA');
  v_product_id := (v_quote->>'productId')::uuid;
  v_rule_id := (v_quote->>'priceRuleId')::uuid;

  if v_override is not null then
    v_amount := v_override;
    v_quote := v_quote || jsonb_build_object('amount', v_amount, 'amountOverride', true);
  end if;

  if nullif(trim(p_gateway_code), '') is not null then
    select * into v_gateway
    from public.finance_gateways
    where code = trim(p_gateway_code)
      and active
      and deleted_at is null;
    if not found then
      raise exception 'gateway % not available', p_gateway_code;
    end if;
  else
    select * into v_gateway
    from public.finance_gateways
    where active
      and deleted_at is null
      and ('AO' = any (country_codes) or '*' = any (country_codes))
      and (module_allowlist is null or v_module = any (module_allowlist))
    order by is_default desc, priority asc, created_at asc
    limit 1;
    if not found then
      raise exception 'no active gateway for module %', v_module;
    end if;
  end if;

  if v_gateway.module_allowlist is not null and not (v_module = any (v_gateway.module_allowlist)) then
    raise exception 'gateway % not allowed for module %', v_gateway.code, v_module;
  end if;

  insert into public.finance_payment_intents (
    user_id, product_id, price_rule_id, amount, currency, country_code,
    status, gateway_code, gateway_ref, sandbox, custody_mode, quote_snapshot,
    description, metadata, module_code, purpose, reference_type, reference_id,
    adapter_code, idempotency_key, expires_at, created_by, updated_by
  )
  values (
    v_actor, v_product_id, v_rule_id, v_amount, v_currency, 'AO',
    'awaiting_payment', v_gateway.code,
    upper(v_gateway.code) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
    v_gateway.sandbox, 'none', v_quote,
    coalesce(nullif(trim(p_description), ''), v_quote->>'productName'),
    coalesce(p_metadata, '{}'::jsonb),
    v_module, p_purpose, p_reference_type, p_reference_id,
    v_gateway.code, v_key, timezone('utc', now()) + interval '30 minutes',
    v_actor, v_actor
  )
  returning id into v_intent_id;

  insert into public.finance_ledger_entries (
    entry_type, status, currency, amount, country_code,
    payer_type, payer_id, payee_type, payee_id,
    product_id, price_rule_id, payment_intent_id,
    gateway_code, gateway_ref, custody_mode, description,
    metadata, created_by, updated_by
  )
  values (
    'charge', 'pending', v_currency, v_amount, 'AO',
    'user', v_actor, 'platform', null,
    v_product_id, v_rule_id, v_intent_id,
    v_gateway.code, null, 'none',
    coalesce(nullif(trim(p_description), ''), v_quote->>'productName'),
    jsonb_build_object('sandbox', v_gateway.sandbox, 'moduleCode', v_module, 'purpose', p_purpose),
    v_actor, v_actor
  )
  returning id into v_ledger_id;

  insert into public.finance_pay_events (
    payment_intent_id, event_type, adapter_code, status_after, payload, created_by
  )
  values (
    v_intent_id, 'created', v_gateway.code, 'awaiting_payment',
    jsonb_build_object(
      'productCode', p_product_code, 'amount', v_amount, 'moduleCode', v_module,
      'purpose', p_purpose, 'referenceType', p_reference_type, 'referenceId', p_reference_id,
      'amountOverride', v_override is not null
    ),
    v_actor
  );

  perform public.write_audit_log(
    'kuteka_pay.intent_created',
    'finance_payment_intent',
    v_intent_id::text,
    jsonb_build_object(
      'product', p_product_code, 'amount', v_amount, 'gateway', v_gateway.code,
      'module', v_module, 'sandbox', v_gateway.sandbox, 'amountOverride', v_override is not null
    )
  );

  return jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'paymentIntentId', v_intent_id,
    'ledgerEntryId', v_ledger_id,
    'amount', v_amount,
    'currency', v_currency,
    'gateway', v_gateway.code,
    'adapterCode', v_gateway.code,
    'sandbox', v_gateway.sandbox,
    'status', 'awaiting_payment',
    'moduleCode', v_module,
    'purpose', p_purpose,
    'quote', v_quote,
    'clientAction', case
      when v_gateway.sandbox then jsonb_build_object('type', 'auto_capture_ready')
      else jsonb_build_object('type', 'gateway_redirect', 'gatewayCode', v_gateway.code)
    end
  );
end;
$$;

revoke all on function public.kuteka_pay_create_intent(
  text, text, text, text, uuid, text, text, text, text, jsonb, numeric
) from public;
grant execute on function public.kuteka_pay_create_intent(
  text, text, text, text, uuid, text, text, text, text, jsonb, numeric
) to authenticated;

-- Marketplace create (sem pagamento imediato) também exige KYC ≥ 2
create or replace function public.marketplace_create_order(
  p_provider_id uuid,
  p_title text,
  p_category text default null,
  p_description text default null,
  p_property_id uuid default null,
  p_sla_hours int default 48
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_provider public.service_providers%rowtype;
  v_order_id uuid;
  v_sla int := greatest(coalesce(p_sla_hours, 48), 1);
  v_due timestamptz;
  v_enabled boolean;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  perform public.assert_actor_meets_kyc(2);

  select enabled into v_enabled from public.platform_feature_flags where code = 'marketplace';
  if coalesce(v_enabled, true) is false then
    raise exception 'marketplace disabled';
  end if;

  if p_title is null or length(trim(p_title)) < 2 then
    raise exception 'title required';
  end if;

  select * into v_provider
  from public.service_providers
  where id = p_provider_id and deleted_at is null and active = true;
  if not found then
    raise exception 'provider not found';
  end if;

  v_due := timezone('utc', now()) + make_interval(hours => v_sla);

  insert into public.service_orders (
    client_id, provider_id, property_id, category, title, description,
    status, currency, sla_hours, sla_due_at, created_by
  )
  values (
    v_actor, p_provider_id, p_property_id,
    coalesce(nullif(p_category, ''), v_provider.category),
    trim(p_title), p_description, 'requested', 'AOA', v_sla, v_due, v_actor
  )
  returning id into v_order_id;

  perform public.marketplace_log_event(
    v_order_id, 'created', null, 'requested',
    'Pedido criado pelo cliente.',
    jsonb_build_object('providerId', p_provider_id, 'slaHours', v_sla)
  );

  perform public.write_audit_log(
    'marketplace.order_created',
    'service_order',
    v_order_id::text,
    jsonb_build_object('provider', v_provider.business_name, 'slaHours', v_sla)
  );

  return jsonb_build_object(
    'ok', true, 'orderId', v_order_id, 'status', 'requested', 'slaDueAt', v_due
  );
end;
$$;

revoke all on function public.marketplace_create_order(uuid, text, text, text, uuid, int) from public;
grant execute on function public.marketplace_create_order(uuid, text, text, text, uuid, int) to authenticated;

-- Snapshot: incluir UTS alias + completeness + photo
create or replace function public.get_identity_party_snapshot(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_addr public.identity_addresses%rowtype;
  v_doc public.identity_id_documents%rowtype;
  v_email text;
  v_email_confirmed boolean := false;
  v_base jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if v_actor is distinct from p_user_id
     and not public.user_has_permission(v_actor, 'admin.panel')
     and not public.user_has_permission(v_actor, 'contracts.manage')
     and not public.user_has_permission(v_actor, 'agent.operate')
     and not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'forbidden';
  end if;

  select * into v_profile
  from public.profiles
  where id = p_user_id and deleted_at is null;

  if not found then
    return null;
  end if;

  select u.email, u.email_confirmed_at is not null
  into v_email, v_email_confirmed
  from auth.users u
  where u.id = p_user_id;

  select * into v_addr
  from public.identity_addresses
  where user_id = p_user_id and deleted_at is null
  limit 1;

  select * into v_doc
  from public.identity_id_documents
  where user_id = p_user_id and deleted_at is null
  order by
    case status when 'accepted' then 0 when 'under_review' then 1 when 'submitted' then 2 else 3 end,
    created_at desc
  limit 1;

  insert into public.identity_access_logs (actor_id, subject_user_id, action, entity_type, entity_id)
  values (v_actor, p_user_id, 'identity.snapshot_read', 'profile', p_user_id::text);

  v_base := jsonb_build_object(
    'userId', p_user_id,
    'legalFullName', v_profile.legal_full_name,
    'preferredName', coalesce(v_profile.preferred_name, v_profile.display_name),
    'displayName', v_profile.display_name,
    'sex', v_profile.sex,
    'birthDate', v_profile.birth_date,
    'nationality', v_profile.nationality,
    'placeOfBirth', v_profile.place_of_birth,
    'maritalStatus', v_profile.marital_status,
    'email', v_email,
    'emailConfirmed', v_email_confirmed,
    'emailSecondary', v_profile.email_secondary,
    'phonePrimary', v_profile.phone_primary,
    'phoneSecondary', v_profile.phone_secondary,
    'phoneVerified', v_profile.phone_verified_at is not null,
    'avatarUrl', v_profile.avatar_url,
    'kycLevel', v_profile.kyc_level,
    'trustIndex', v_profile.trust_index,
    'uts', v_profile.trust_index,
    'kisCompleteness', v_profile.kis_completeness,
    'livenessStatus', v_profile.liveness_status,
    'document', case when v_doc.id is null then null else jsonb_build_object(
      'id', v_doc.id,
      'kind', v_doc.doc_kind,
      'number', v_doc.doc_number,
      'issuedOn', v_doc.issued_on,
      'expiresOn', v_doc.expires_on,
      'issuedAt', v_doc.issued_at,
      'issuingCountry', v_doc.issuing_country,
      'status', v_doc.status,
      'ocrStatus', v_doc.ocr_status,
      'encryptionScheme', v_doc.encryption_scheme
    ) end,
    'address', case when v_addr.id is null then null else jsonb_build_object(
      'country', v_addr.country,
      'province', v_addr.province,
      'municipality', v_addr.municipality,
      'commune', v_addr.commune,
      'neighborhood', v_addr.neighborhood,
      'street', v_addr.street,
      'number', v_addr.number,
      'postalCode', v_addr.postal_code,
      'gpsLat', v_addr.gps_lat,
      'gpsLng', v_addr.gps_lng,
      'line', concat_ws(', ',
        nullif(trim(concat_ws(' ', v_addr.street, v_addr.number)), ''),
        v_addr.neighborhood,
        v_addr.commune,
        v_addr.municipality,
        v_addr.province,
        v_addr.country
      )
    ) end
  );

  return v_base;
end;
$$;

revoke all on function public.get_identity_party_snapshot(uuid) from public;
grant execute on function public.get_identity_party_snapshot(uuid) to authenticated;

-- Backfill completeness for existing profiles
do $$
declare
  r record;
begin
  for r in select id from public.profiles where deleted_at is null loop
    perform public.recompute_profile_kyc(r.id);
  end loop;
end $$;
