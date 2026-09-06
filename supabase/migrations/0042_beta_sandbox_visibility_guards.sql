-- Sprint Beta — close residual 0041 / D3 / KUT-REQ-005 / KUT-REQ-007 / KUT-REQ-010 gaps.
-- Reuses existing functions, policies and columns. No new engines. No Pay real.
-- Does not drop tables, users, intents, or adapter rows.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Guarantee the sandbox gateway row exists, then lock is_default to it
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.finance_gateways (
  code, name, country_codes, sandbox, active, supports_split, config, priority, is_default
)
select
  'sandbox',
  'Kuteka Pay Sandbox',
  array['AO', '*']::text[],
  true,
  true,
  false,
  '{"mode":"test"}'::jsonb,
  1,
  false
where not exists (
  select 1 from public.finance_gateways where code = 'sandbox'
);

update public.finance_gateways
set sandbox = true,
    active = true,
    deleted_at = null
where code = 'sandbox';

update public.finance_gateways
set is_default = (code = 'sandbox')
where deleted_at is null;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Mercado visibility (D3 + KUT-REQ-010) — no demo, no occupied inventory
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.property_is_publicly_visible(p public.properties)
returns boolean
language sql
stable
as $$
  select
    p.deleted_at is null
    and p.status = 'active'
    and coalesce(p.is_demo, false) = false
    and coalesce(p.review_status, 'approved') = 'approved'
    and (
      p.premium_visible_at is null
      or p.premium_visible_at <= timezone('utc', now())
    )
    and (
      coalesce(p.lifecycle_status, 'publicado') in (
        'publicado',
        'janela_premium',
        'em_negociacao',
        'disponivel_novamente',
        'libertacao_prevista',
        'temporariamente_indisponivel',
        'em_manutencao'
      )
      or (
        p.expected_available_on is not null
        and p.expected_available_on >= current_date
      )
    );
$$;

comment on function public.property_is_publicly_visible(public.properties) is
  'D3 / KUT-REQ-007 / KUT-REQ-010: Mercado excludes DEMO, drafts and occupied lifecycles.';

drop policy if exists properties_select_active_housing on public.properties;
create policy properties_select_active_housing
  on public.properties for select to authenticated
  using (
    public.user_has_permission(auth.uid(), 'housing.explore')
    and public.property_is_publicly_visible(properties)
  );

drop policy if exists properties_select_active_agent on public.properties;
create policy properties_select_active_agent
  on public.properties for select to authenticated
  using (
    public.user_has_permission(auth.uid(), 'agent.operate')
    and public.property_is_publicly_visible(properties)
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Pay intents — always resolve the sandbox gateway (KUT-REQ-005)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.kuteka_pay_resolve_sandbox_gateway(p_requested text)
returns public.finance_gateways
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_code text := lower(trim(coalesce(p_requested, '')));
  v_gateway public.finance_gateways%rowtype;
begin
  if v_code <> '' and v_code is distinct from 'sandbox' then
    raise exception 'beta sandbox only: payment intents must use sandbox';
  end if;

  select * into v_gateway
  from public.finance_gateways
  where code = 'sandbox'
    and deleted_at is null;

  if not found then
    raise exception 'sandbox gateway not found';
  end if;
  if v_gateway.sandbox is not true or v_gateway.active is not true then
    raise exception 'sandbox gateway is not active';
  end if;
  return v_gateway;
end;
$$;

revoke all on function public.kuteka_pay_resolve_sandbox_gateway(text) from public;
grant execute on function public.kuteka_pay_resolve_sandbox_gateway(text) to authenticated;

comment on function public.kuteka_pay_resolve_sandbox_gateway(text) is
  'Beta lock: only the sandbox finance_gateways row may back a payment intent.';

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

  perform public.assert_actor_meets_kyc(2);

  v_gateway := public.kuteka_pay_resolve_sandbox_gateway(p_gateway_code);

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
    'awaiting_payment', 'sandbox',
    'SANDBOX-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
    true, 'none', v_quote,
    coalesce(nullif(trim(p_description), ''), v_quote->>'productName'),
    coalesce(p_metadata, '{}'::jsonb),
    v_module, p_purpose, p_reference_type, p_reference_id,
    'sandbox', v_key, timezone('utc', now()) + interval '30 minutes',
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
    'sandbox', null, 'none',
    coalesce(nullif(trim(p_description), ''), v_quote->>'productName'),
    jsonb_build_object('sandbox', true, 'moduleCode', v_module, 'purpose', p_purpose, 'betaLock', true),
    v_actor, v_actor
  )
  returning id into v_ledger_id;

  insert into public.finance_pay_events (
    payment_intent_id, event_type, adapter_code, status_after, payload, created_by
  )
  values (
    v_intent_id, 'created', 'sandbox', 'awaiting_payment',
    jsonb_build_object(
      'productCode', p_product_code, 'amount', v_amount, 'moduleCode', v_module,
      'purpose', p_purpose, 'referenceType', p_reference_type, 'referenceId', p_reference_id,
      'amountOverride', v_override is not null, 'betaLock', true
    ),
    v_actor
  );

  perform public.write_audit_log(
    'kuteka_pay.intent_created',
    'finance_payment_intent',
    v_intent_id::text,
    jsonb_build_object(
      'product', p_product_code, 'amount', v_amount, 'gateway', 'sandbox',
      'module', v_module, 'sandbox', true, 'amountOverride', v_override is not null,
      'betaLock', true
    )
  );

  return jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'paymentIntentId', v_intent_id,
    'ledgerEntryId', v_ledger_id,
    'amount', v_amount,
    'currency', v_currency,
    'gateway', 'sandbox',
    'adapterCode', 'sandbox',
    'sandbox', true,
    'status', 'awaiting_payment',
    'moduleCode', v_module,
    'purpose', p_purpose,
    'quote', v_quote,
    'clientAction', jsonb_build_object('type', 'auto_capture_ready')
  );
end;
$$;

revoke all on function public.kuteka_pay_create_intent(
  text, text, text, text, uuid, text, text, text, text, jsonb, numeric
) from public;
grant execute on function public.kuteka_pay_create_intent(
  text, text, text, text, uuid, text, text, text, text, jsonb, numeric
) to authenticated;

comment on function public.kuteka_pay_create_intent(
  text, text, text, text, uuid, text, text, text, text, jsonb, numeric
) is
  'Beta lock: creates intents only on the sandbox adapter. custody_mode remains none.';

create or replace function public.finance_create_sandbox_payment(
  p_product_code text,
  p_urgency_band text default null,
  p_gateway_code text default 'sandbox',
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_module text;
begin
  if lower(trim(coalesce(p_gateway_code, ''))) not in ('', 'sandbox') then
    raise exception 'beta sandbox only: payment intents must use sandbox';
  end if;

  v_module := case
    when p_product_code like 'smart_move.%' then 'smart_move'
    when p_product_code like 'find_home.%' then 'smart_move'
    when p_product_code like 'partner.%' then 'partner_plan'
    when p_product_code like 'kuteka_plus.%' then 'plus'
    when p_product_code like 'concierge.%' then 'concierge'
    when p_product_code like 'avaliacao.%' then 'valuation'
    when p_product_code like 'reserva.%' then 'booking'
    when p_product_code like 'destaque.%' then 'marketplace'
    else 'other'
  end;

  return public.kuteka_pay_create_intent(
    p_product_code := p_product_code,
    p_module_code := v_module,
    p_purpose := 'legacy_sandbox',
    p_reference_type := null,
    p_reference_id := null,
    p_urgency_band := p_urgency_band,
    p_gateway_code := 'sandbox',
    p_idempotency_key := null,
    p_description := p_description,
    p_metadata := '{}'::jsonb
  );
end;
$$;

revoke all on function public.finance_create_sandbox_payment(text, text, text, text) from public;
grant execute on function public.finance_create_sandbox_payment(text, text, text, text) to authenticated;

create or replace function public.finance_payment_intents_beta_sandbox_guard()
returns trigger
language plpgsql
as $$
begin
  if new.gateway_code is distinct from 'sandbox' then
    raise exception 'beta sandbox only: payment intents must use sandbox';
  end if;
  new.gateway_code := 'sandbox';
  new.adapter_code := 'sandbox';
  new.sandbox := true;
  new.custody_mode := 'none';
  return new;
end;
$$;

drop trigger if exists finance_payment_intents_beta_sandbox_guard on public.finance_payment_intents;
create trigger finance_payment_intents_beta_sandbox_guard
before insert or update on public.finance_payment_intents
for each row execute function public.finance_payment_intents_beta_sandbox_guard();

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Interest / notify must not target DEMO or occupied Mercado rows
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.express_property_interest(
  p_property_id uuid,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if not public.user_has_permission(v_actor, 'housing.explore') then
    raise exception 'housing.explore required';
  end if;

  if not exists (
    select 1 from public.properties p
    where p.id = p_property_id
      and public.property_is_publicly_visible(p)
      and coalesce(p.lifecycle_status, 'publicado') in (
        'publicado',
        'janela_premium',
        'em_negociacao',
        'disponivel_novamente'
      )
  ) then
    raise exception 'property not available';
  end if;

  insert into public.property_interests (
    client_id, property_id, status, notes, created_by, updated_by
  )
  values (
    v_actor, p_property_id, 'submitted',
    nullif(trim(coalesce(p_notes, '')), ''),
    v_actor, v_actor
  )
  on conflict (client_id, property_id) do update
  set notes = coalesce(excluded.notes, public.property_interests.notes),
      status = case
        when public.property_interests.status = 'closed' then 'submitted'
        else public.property_interests.status
      end,
      updated_by = v_actor
  returning id into v_id;

  perform public.write_audit_log(
    'property.interest_expressed',
    'property_interest',
    v_id::text,
    jsonb_build_object('property_id', p_property_id)
  );

  return v_id;
end;
$$;

revoke all on function public.express_property_interest(uuid, text) from public;
grant execute on function public.express_property_interest(uuid, text) to authenticated;

create or replace function public.request_availability_notify(p_property_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_prop public.properties%rowtype;
begin
  if v_actor is null then
    raise exception 'not authenticated';
  end if;

  select * into v_prop
  from public.properties
  where id = p_property_id
    and deleted_at is null;
  if not found then
    raise exception 'property not found';
  end if;
  if coalesce(v_prop.is_demo, false) then
    raise exception 'property not available';
  end if;
  if public.property_is_publicly_visible(v_prop)
    and (v_prop.expected_available_on is null or v_prop.expected_available_on <= current_date)
    and coalesce(v_prop.lifecycle_status, 'publicado') not in (
      'libertacao_prevista',
      'temporariamente_indisponivel',
      'em_manutencao'
    )
  then
    raise exception 'property already available';
  end if;

  insert into public.availability_notify_requests (client_id, property_id, status)
  values (v_actor, p_property_id, 'open')
  on conflict (client_id, property_id) do update
    set status = 'open',
        updated_at = timezone('utc', now())
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.request_availability_notify(uuid) from public;
grant execute on function public.request_availability_notify(uuid) to authenticated, service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. KOCC metrics — do not count DEMO interest as real visits
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.kocc_beta_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_profiles int;
  v_beta_users int;
  v_with_roles int;
  v_kis_ok int;
  v_props_real int;
  v_props_beta int;
  v_visits int;
  v_contracts_started int;
  v_feedback int;
  v_bugs int;
  v_features_most jsonb;
  v_features_least jsonb;
  v_proxy jsonb;
begin
  if v_actor is null or not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'finance.manage required';
  end if;

  select count(*)::int into v_profiles
  from public.profiles where deleted_at is null;

  select count(*)::int into v_beta_users
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.deleted_at is null
    and (u.email is null or u.email not ilike '%@kuteka.local');

  select count(distinct ur.user_id)::int into v_with_roles
  from public.user_roles ur
  join public.profiles p on p.id = ur.user_id and p.deleted_at is null
  join auth.users u on u.id = p.id
  where u.email is null or u.email not ilike '%@kuteka.local';

  select count(*)::int into v_kis_ok
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.deleted_at is null
    and coalesce(p.kyc_level, 0) >= 2
    and (u.email is null or u.email not ilike '%@kuteka.local');

  select count(*)::int into v_props_real
  from public.properties
  where deleted_at is null
    and coalesce(is_demo, false) = false
    and status = 'active';

  select count(*)::int into v_props_beta
  from public.properties
  where deleted_at is null
    and coalesce(is_demo, false) = true;

  select count(*)::int into v_visits
  from public.property_interests i
  join public.properties p on p.id = i.property_id
  where i.status in ('submitted', 'reviewing', 'assigned')
    and coalesce(p.is_demo, false) = false;

  select count(*)::int into v_contracts_started
  from public.property_contracts
  where coalesce(is_demo, false) = false
    and status in ('draft', 'pending_acceptance', 'active');

  select count(*)::int into v_feedback
  from public.beta_feedback where kind = 'feedback';

  select count(*)::int into v_bugs
  from public.beta_feedback where kind = 'bug';

  v_proxy := jsonb_build_array(
    jsonb_build_object('code', 'housing.interest', 'label', 'Demonstrar interesse',
      'count', (
        select count(*)::int
        from public.property_interests i
        join public.properties p on p.id = i.property_id
        where coalesce(p.is_demo, false) = false
      )),
    jsonb_build_object('code', 'contratos.prepare', 'label', 'Contratos',
      'count', (
        select count(*)::int from public.property_contracts
        where coalesce(is_demo, false) = false
      )),
    jsonb_build_object('code', 'kuteka_chat', 'label', 'Chat Kuteka',
      'count', (select count(*)::int from public.kuteka_messages)),
    jsonb_build_object('code', 'confianca.documents', 'label', 'Documentos de confiança',
      'count', (select count(*)::int from public.trust_documents where deleted_at is null)),
    jsonb_build_object('code', 'kis.profile', 'label', 'Identidade KIS/KYC',
      'count', (select count(*)::int from public.profiles where coalesce(kyc_level, 0) >= 1 and deleted_at is null)),
    jsonb_build_object('code', 'patrimonios.activate', 'label', 'Patrimónios activos',
      'count', (
        select count(*)::int from public.properties
        where deleted_at is null and status = 'active' and coalesce(is_demo, false) = false
      )),
    jsonb_build_object('code', 'marketplace', 'label', 'Prestadores',
      'count', (
        select count(*)::int from public.service_providers
        where coalesce(active, true) and coalesce(is_demo, false) = false
      ))
  );

  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_features_most
  from (
    select feature_code as code, label, event_count as count
    from public.beta_feature_events
    order by event_count desc, feature_code
    limit 8
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_features_least
  from (
    select feature_code as code, label, event_count as count
    from public.beta_feature_events
    order by event_count asc, feature_code
    limit 8
  ) t;

  return jsonb_build_object(
    'generatedAt', timezone('utc', now()),
    'betaUsers', v_beta_users,
    'profilesTotal', v_profiles,
    'propertiesReal', v_props_real,
    'propertiesBetaInventory', v_props_beta,
    'visitsScheduled', v_visits,
    'contractsStarted', v_contracts_started,
    'feedbackReceived', v_feedback,
    'bugsReported', v_bugs,
    'onboardingCompletionRate',
      case when v_beta_users > 0
        then round((v_with_roles::numeric / v_beta_users::numeric) * 100, 1)
        else 0
      end,
    'kisCompletionRate',
      case when v_beta_users > 0
        then round((v_kis_ok::numeric / v_beta_users::numeric) * 100, 1)
        else 0
      end,
    'featuresMostUsed', v_features_most,
    'featuresLeastUsed', v_features_least,
    'featureUsageProxy', v_proxy,
    'modulesOperational', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'code', code,
        'label', label,
        'status', operational_status,
        'enabled', enabled
      ) order by label), '[]'::jsonb)
      from public.platform_feature_flags
    )
  );
end;
$$;

revoke all on function public.kocc_beta_metrics() from public;
grant execute on function public.kocc_beta_metrics() to authenticated;
