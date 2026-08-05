-- Fase D2 — Encontrar Casa (procura prioritária pay-per-use)
-- Ref: Arquitectura Financeira v1.0 · ADR-015 · ADR-017 · ADR-018 · ADR-019 · ADR-020 · ADR-021
-- Implementa a "Encontrar Casa" como serviço de procura prioritária sobre a MESMA
-- infraestrutura financeira partilhada (Ledger + Kuteka Pay + reembolsos/créditos).
-- Nenhum caminho de pagamento isolado. Uma única taxa: a prioridade de procura.
--
-- Fluxo (N5, simplificado — uma só taxa):
-- draft → awaiting_payment → active → matched → completed | cancelled | failed
--   · prioridade: cobrada no arranque (priority_fee) via Kuteka Pay
--   · sem taxa de sucesso (aceitar o match não cobra nada em D2)
--   · reembolso/créditos: cancelamento antes do match ou falha da Kuteka → 100 %
--
-- Custódia continua desligada (custody_mode = none). Sandbox apenas nesta fase.
-- Aditivo (Core v1 freeze respeitado): apenas novas colunas/tabelas/RPCs.

-- ═══════════════════════════════════════════════════════════════════════════
-- 0. Feature flag (Service Health)
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.platform_feature_flags (code, label, description, enabled) values
  ('find_home', 'Encontrar Casa', 'Procura prioritária de habitação compatível', true)
on conflict (code) do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. find_home_requests — pedido de procura prioritária
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.find_home_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  province text,
  municipality text,
  typology text,
  budget_max_aoa numeric(14, 2),
  preferences jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
    check (status in (
      'draft', 'awaiting_payment', 'active', 'matched', 'completed', 'cancelled', 'failed'
    )),
  payment_intent_id uuid references public.finance_payment_intents (id),
  priority_amount_aoa numeric(14, 2),
  matched_property_id uuid references public.properties (id),
  match_notes text,
  accepted_match boolean not null default false,
  sla_hours int,
  sla_due_at timestamptz,
  sla_breached boolean not null default false,
  kai_notes text,
  matched_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  cancelled_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

create index if not exists find_home_requests_client_idx
  on public.find_home_requests (client_id, created_at desc)
  where deleted_at is null;
create index if not exists find_home_requests_status_idx
  on public.find_home_requests (status)
  where deleted_at is null;
create index if not exists find_home_requests_sla_idx
  on public.find_home_requests (sla_due_at)
  where deleted_at is null and sla_breached = false;

drop trigger if exists find_home_requests_set_updated_at on public.find_home_requests;
create trigger find_home_requests_set_updated_at
before update on public.find_home_requests
for each row execute function public.set_updated_at();

alter table public.find_home_requests enable row level security;

-- Leitura: cliente dono do pedido ou operadores (finance/admin/agente/propriedades).
drop policy if exists find_home_select on public.find_home_requests;
create policy find_home_select
  on public.find_home_requests for select to authenticated
  using (
    deleted_at is null
    and (
      client_id = auth.uid()
      or public.user_has_permission(auth.uid(), 'admin.panel')
      or public.user_has_permission(auth.uid(), 'finance.manage')
      or public.user_has_permission(auth.uid(), 'agent.operate')
      or public.user_has_permission(auth.uid(), 'properties.manage')
    )
  );

drop policy if exists find_home_insert on public.find_home_requests;
create policy find_home_insert
  on public.find_home_requests for insert to authenticated
  with check (client_id = auth.uid());

drop policy if exists find_home_update on public.find_home_requests;
create policy find_home_update
  on public.find_home_requests for update to authenticated
  using (
    client_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'admin.panel')
    or public.user_has_permission(auth.uid(), 'finance.manage')
    or public.user_has_permission(auth.uid(), 'agent.operate')
  )
  with check (
    client_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'admin.panel')
    or public.user_has_permission(auth.uid(), 'finance.manage')
    or public.user_has_permission(auth.uid(), 'agent.operate')
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. find_home_events — timeline append-only (mesmo padrão de smart_move_events)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.find_home_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.find_home_requests (id) on delete cascade,
  event_type text not null
    check (event_type in (
      'created', 'activated', 'matched', 'accepted', 'rejected',
      'completed', 'cancelled', 'failed', 'refunded', 'sla_breached', 'note'
    )),
  from_status text,
  to_status text,
  actor_id uuid references auth.users (id),
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists find_home_events_request_idx
  on public.find_home_events (request_id, created_at desc);

alter table public.find_home_events enable row level security;

drop policy if exists find_home_events_select on public.find_home_events;
create policy find_home_events_select
  on public.find_home_events for select to authenticated
  using (
    exists (
      select 1
      from public.find_home_requests r
      where r.id = request_id
        and (
          r.client_id = auth.uid()
          or public.user_has_permission(auth.uid(), 'finance.manage')
          or public.user_has_permission(auth.uid(), 'admin.panel')
          or public.user_has_permission(auth.uid(), 'agent.operate')
          or public.user_has_permission(auth.uid(), 'properties.manage')
        )
    )
  );

-- Escrita apenas via RPCs security definer (append-only, sem update/delete).
create or replace function public.find_home_log_event(
  p_request_id uuid,
  p_event_type text,
  p_from_status text default null,
  p_to_status text default null,
  p_note text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.find_home_events (
    request_id, event_type, from_status, to_status, actor_id, note, metadata
  )
  values (
    p_request_id, p_event_type, p_from_status, p_to_status, auth.uid(), p_note,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.find_home_log_event(uuid, text, text, text, text, jsonb) from public;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Reembolso da taxa de prioridade em créditos (reutiliza tabelas genéricas)
--    Uma só taxa → sempre 100 % quando aplicável (cancelamento/falha).
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.find_home_credit_refund(
  p_request_id uuid,
  p_pct numeric,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.find_home_requests%rowtype;
  v_charge public.finance_ledger_entries%rowtype;
  v_amount numeric(14, 2);
  v_pct numeric := greatest(least(coalesce(p_pct, 0), 1), 0);
  v_account_id uuid;
  v_balance numeric(14, 2);
  v_refund_id uuid;
  v_credit_tx uuid;
  v_refund_ledger uuid;
begin
  select * into v_request from public.find_home_requests where id = p_request_id;
  if not found then
    return jsonb_build_object('ok', false, 'refunded', false, 'reason', 'request not found');
  end if;
  if v_request.payment_intent_id is null or v_pct <= 0 then
    return jsonb_build_object('ok', true, 'refunded', false);
  end if;

  select * into v_charge
  from public.finance_ledger_entries
  where payment_intent_id = v_request.payment_intent_id
    and entry_type = 'charge'
  order by created_at asc
  limit 1;
  if not found or v_charge.status = 'refunded' then
    return jsonb_build_object('ok', true, 'refunded', false);
  end if;

  v_amount := round(coalesce(v_request.priority_amount_aoa, v_charge.amount) * v_pct, 2);
  if v_amount <= 0 then
    return jsonb_build_object('ok', true, 'refunded', false);
  end if;

  insert into public.finance_refunds (
    ledger_entry_id, payment_intent_id, user_id, amount, currency,
    mode, status, reason, created_by
  )
  values (
    v_charge.id, v_request.payment_intent_id, v_request.client_id, v_amount,
    coalesce(v_charge.currency, 'AOA'), 'credits', 'pending',
    coalesce(nullif(trim(p_reason), ''), 'Encontrar Casa — reembolso da prioridade'), v_actor
  )
  returning id into v_refund_id;

  insert into public.finance_credit_accounts (user_id, balance, currency, country_code)
  values (v_request.client_id, 0, 'AOA', 'AO')
  on conflict (user_id) do nothing;

  select id, balance into v_account_id, v_balance
  from public.finance_credit_accounts
  where user_id = v_request.client_id
  for update;

  v_balance := coalesce(v_balance, 0) + v_amount;
  update public.finance_credit_accounts
  set balance = v_balance, updated_at = timezone('utc', now())
  where id = v_account_id;

  insert into public.finance_ledger_entries (
    entry_type, status, currency, amount, country_code,
    payer_type, payer_id, payee_type, payee_id, payment_intent_id,
    custody_mode, description, metadata, created_by, updated_by
  )
  values (
    'refund', 'captured', coalesce(v_charge.currency, 'AOA'), v_amount, 'AO',
    'platform', null, 'user', v_request.client_id, v_request.payment_intent_id,
    'none', 'Reembolso Encontrar Casa — ' || coalesce(nullif(trim(p_reason), ''), 'créditos'),
    jsonb_build_object('refundId', v_refund_id, 'mode', 'credits', 'requestId', p_request_id, 'pct', v_pct),
    v_actor, v_actor
  )
  returning id into v_refund_ledger;

  insert into public.finance_credit_transactions (
    account_id, user_id, direction, amount, balance_after, reason, ledger_entry_id, created_by
  )
  values (
    v_account_id, v_request.client_id, 'grant', v_amount, v_balance,
    coalesce(nullif(trim(p_reason), ''), 'Reembolso Encontrar Casa'), v_refund_ledger, v_actor
  )
  returning id into v_credit_tx;

  update public.finance_refunds
  set status = 'completed', credit_transaction_id = v_credit_tx,
      refund_ledger_entry_id = v_refund_ledger,
      resolved_by = v_actor, resolved_at = timezone('utc', now())
  where id = v_refund_id;

  update public.finance_ledger_entries
  set status = 'refunded', updated_by = v_actor
  where id = v_charge.id;

  return jsonb_build_object(
    'ok', true, 'refunded', true, 'refundId', v_refund_id, 'amount', v_amount,
    'creditBalance', v_balance, 'pct', v_pct
  );
end;
$$;

revoke all on function public.find_home_credit_refund(uuid, numeric, text) from public;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Contexto do utilizador (para decidir o painel de matching na UI)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.find_home_my_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_can_operate boolean;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  v_can_operate := public.user_has_permission(v_actor, 'agent.operate')
    or public.user_has_permission(v_actor, 'finance.manage')
    or public.user_has_permission(v_actor, 'admin.panel');

  return jsonb_build_object('ok', true, 'canOperate', v_can_operate);
end;
$$;

revoke all on function public.find_home_my_context() from public;
grant execute on function public.find_home_my_context() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. create_find_home_request — cobra a prioridade via Kuteka Pay e activa
--    (module_code = find_home, purpose = priority_fee, produto find_home.priority)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.create_find_home_request(
  p_province text default null,
  p_municipality text default null,
  p_typology text default null,
  p_budget_max numeric default null,
  p_notes text default null,
  p_preferences jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request_id uuid;
  v_pay jsonb;
  v_enabled boolean;
  v_sla int := 168; -- 7 dias de procura prioritária (valor razoável N5)
  v_due timestamptz;
  v_intent_id uuid;
  v_amount numeric(14, 2);
  v_client_action text;
  v_captured boolean := false;
  v_prefs jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select enabled into v_enabled from public.platform_feature_flags where code = 'find_home';
  if coalesce(v_enabled, true) is false then
    raise exception 'find_home disabled';
  end if;

  v_due := timezone('utc', now()) + make_interval(hours => v_sla);
  v_prefs := coalesce(p_preferences, '{}'::jsonb)
    || jsonb_strip_nulls(jsonb_build_object(
         'province', nullif(trim(p_province), ''),
         'municipality', nullif(trim(p_municipality), ''),
         'typology', nullif(trim(p_typology), ''),
         'budgetMax', p_budget_max,
         'notes', nullif(trim(p_notes), '')
       ));

  insert into public.find_home_requests (
    client_id, province, municipality, typology, budget_max_aoa,
    status, preferences, sla_hours, sla_due_at, kai_notes, created_by, updated_by
  )
  values (
    v_actor,
    nullif(trim(p_province), ''),
    nullif(trim(p_municipality), ''),
    nullif(trim(p_typology), ''),
    p_budget_max,
    'awaiting_payment',
    v_prefs,
    v_sla,
    v_due,
    'KAI: procura prioritária iniciada. Agentes e a rede Kuteka serão notificados ' ||
      'após o pagamento da prioridade. Sugestões respeitam as suas preferências e consentimentos.',
    v_actor,
    v_actor
  )
  returning id into v_request_id;

  perform public.find_home_log_event(
    v_request_id, 'created', null, 'awaiting_payment',
    'Pedido de procura criado pelo cliente.',
    jsonb_build_object('slaHours', v_sla)
  );

  -- Taxa de prioridade via motor unificado Kuteka Pay (nenhum caminho isolado).
  v_pay := public.kuteka_pay_create_intent(
    p_product_code := 'find_home.priority',
    p_module_code := 'find_home',
    p_purpose := 'priority_fee',
    p_reference_type := 'find_home_request',
    p_reference_id := v_request_id,
    p_urgency_band := null,
    p_gateway_code := 'sandbox',
    p_idempotency_key := 'findhome-priority-' || v_request_id::text,
    p_description := 'Encontrar Casa — taxa de prioridade',
    p_metadata := jsonb_build_object('requestId', v_request_id),
    p_amount_override := null
  );

  v_intent_id := (v_pay->>'paymentIntentId')::uuid;
  v_amount := coalesce((v_pay->>'amount')::numeric, 0);
  v_client_action := v_pay->'clientAction'->>'type';

  update public.find_home_requests
  set payment_intent_id = v_intent_id,
      priority_amount_aoa = v_amount,
      updated_by = v_actor
  where id = v_request_id;

  -- Sandbox: captura automática da prioridade → activa a procura.
  if v_client_action in ('auto_capture_ready', 'already_captured') then
    if v_client_action = 'auto_capture_ready' then
      perform public.kuteka_pay_capture(v_intent_id);
    end if;
    v_captured := true;

    update public.find_home_requests
    set status = 'active',
        kai_notes = kai_notes ||
          ' Prioridade capturada (sandbox). Procura activa: agentes notificados.',
        updated_by = v_actor
    where id = v_request_id;

    perform public.find_home_log_event(
      v_request_id, 'activated', 'awaiting_payment', 'active',
      'Prioridade capturada (sandbox). Procura activa.',
      jsonb_build_object('paymentIntentId', v_intent_id, 'amount', v_amount)
    );
  end if;

  perform public.write_audit_log(
    'find_home.created',
    'find_home_request',
    v_request_id::text,
    jsonb_build_object('priorityAmount', v_amount, 'captured', v_captured)
  );

  return jsonb_build_object(
    'ok', true,
    'requestId', v_request_id,
    'status', case when v_captured then 'active' else 'awaiting_payment' end,
    'priorityAmount', v_amount,
    'payment', v_pay
  );
end;
$$;

revoke all on function public.create_find_home_request(text, text, text, numeric, text, jsonb) from public;
grant execute on function public.create_find_home_request(text, text, text, numeric, text, jsonb) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. RPCs do ciclo de matching (security definer)
-- ═══════════════════════════════════════════════════════════════════════════

-- 6.1 Registar match (agente / admin / finance.manage) — active → matched
create or replace function public.find_home_match(
  p_request_id uuid,
  p_matched_property_id uuid default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.find_home_requests%rowtype;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if not (
    public.user_has_permission(v_actor, 'agent.operate')
    or public.user_has_permission(v_actor, 'finance.manage')
    or public.user_has_permission(v_actor, 'admin.panel')
  ) then
    raise exception 'agent.operate or finance.manage required';
  end if;

  select * into v_request from public.find_home_requests where id = p_request_id and deleted_at is null;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.status <> 'active' then
    raise exception 'request must be active to match (%).', v_request.status;
  end if;

  update public.find_home_requests
  set status = 'matched',
      matched_property_id = p_matched_property_id,
      match_notes = nullif(trim(p_notes), ''),
      matched_at = timezone('utc', now()),
      accepted_match = false,
      kai_notes = coalesce(kai_notes, '') || ' Casa compatível encontrada — a aguardar decisão do cliente.',
      updated_by = v_actor
  where id = p_request_id;

  perform public.find_home_log_event(
    p_request_id, 'matched', 'active', 'matched',
    nullif(trim(p_notes), ''),
    jsonb_build_object('matchedPropertyId', p_matched_property_id)
  );
  perform public.write_audit_log(
    'find_home.matched', 'find_home_request', p_request_id::text,
    jsonb_build_object('matchedPropertyId', p_matched_property_id)
  );

  return jsonb_build_object('ok', true, 'requestId', p_request_id, 'status', 'matched');
end;
$$;

revoke all on function public.find_home_match(uuid, uuid, text) from public;
grant execute on function public.find_home_match(uuid, uuid, text) to authenticated;

-- 6.2 Aceitar match (cliente) — matched → completed (sem taxa adicional em D2)
create or replace function public.find_home_accept_match(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.find_home_requests%rowtype;
  v_breached boolean;
  v_now timestamptz := timezone('utc', now());
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_request from public.find_home_requests where id = p_request_id and deleted_at is null;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.client_id <> v_actor and not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'only the client can accept the match';
  end if;
  if v_request.status <> 'matched' then
    raise exception 'request has no pending match (%).', v_request.status;
  end if;

  v_breached := v_request.sla_due_at is not null and v_now > v_request.sla_due_at;

  update public.find_home_requests
  set accepted_match = true,
      status = 'completed',
      completed_at = v_now,
      sla_breached = v_breached,
      kai_notes = coalesce(kai_notes, '') || ' Casa aceite pelo cliente. Procura concluída.',
      updated_by = v_actor
  where id = p_request_id;

  perform public.find_home_log_event(
    p_request_id, 'accepted', 'matched', 'matched',
    'Cliente aceitou a casa encontrada.', '{}'::jsonb
  );
  perform public.find_home_log_event(
    p_request_id, 'completed', 'matched', 'completed',
    'Procura concluída com sucesso (sem taxa adicional).',
    jsonb_build_object('slaBreached', v_breached)
  );
  perform public.write_audit_log(
    'find_home.completed', 'find_home_request', p_request_id::text,
    jsonb_build_object('slaBreached', v_breached)
  );

  return jsonb_build_object(
    'ok', true, 'requestId', p_request_id, 'status', 'completed', 'slaBreached', v_breached
  );
end;
$$;

revoke all on function public.find_home_accept_match(uuid) from public;
grant execute on function public.find_home_accept_match(uuid) to authenticated;

-- 6.3 Rejeitar match (cliente) — matched → active (procura retomada)
create or replace function public.find_home_reject_match(
  p_request_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.find_home_requests%rowtype;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_request from public.find_home_requests where id = p_request_id and deleted_at is null;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.client_id <> v_actor and not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'only the client can reject the match';
  end if;
  if v_request.status <> 'matched' then
    raise exception 'request has no pending match (%).', v_request.status;
  end if;

  update public.find_home_requests
  set status = 'active',
      accepted_match = false,
      matched_property_id = null,
      match_notes = null,
      matched_at = null,
      kai_notes = coalesce(kai_notes, '') || ' Casa recusada pelo cliente. Procura retomada.',
      updated_by = v_actor
  where id = p_request_id;

  perform public.find_home_log_event(
    p_request_id, 'rejected', 'matched', 'active',
    nullif(trim(p_reason), ''), '{}'::jsonb
  );
  perform public.write_audit_log(
    'find_home.rejected', 'find_home_request', p_request_id::text,
    jsonb_build_object('reason', p_reason)
  );

  return jsonb_build_object('ok', true, 'requestId', p_request_id, 'status', 'active');
end;
$$;

revoke all on function public.find_home_reject_match(uuid, text) from public;
grant execute on function public.find_home_reject_match(uuid, text) to authenticated;

-- 6.4 Falhar (agente / admin / finance.manage) — active|matched → failed
--     Reembolso integral da prioridade em créditos (a Kuteka não entregou).
create or replace function public.find_home_fail(
  p_request_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.find_home_requests%rowtype;
  v_now timestamptz := timezone('utc', now());
  v_breached boolean;
  v_refund jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if not (
    public.user_has_permission(v_actor, 'agent.operate')
    or public.user_has_permission(v_actor, 'finance.manage')
    or public.user_has_permission(v_actor, 'admin.panel')
  ) then
    raise exception 'agent.operate or finance.manage required';
  end if;

  select * into v_request from public.find_home_requests where id = p_request_id and deleted_at is null;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.status not in ('active', 'matched') then
    raise exception 'request cannot fail from % state', v_request.status;
  end if;

  v_breached := v_request.sla_due_at is not null and v_now > v_request.sla_due_at;

  v_refund := public.find_home_credit_refund(
    p_request_id, 1.00,
    'Encontrar Casa — procura sem solução (reembolso integral)'
  );

  update public.find_home_requests
  set status = 'failed',
      failed_at = v_now,
      failure_reason = nullif(trim(p_reason), ''),
      sla_breached = v_breached,
      kai_notes = coalesce(kai_notes, '') || ' Procura sem solução. Prioridade devolvida em créditos.',
      updated_by = v_actor
  where id = p_request_id;

  perform public.find_home_log_event(
    p_request_id, 'failed', v_request.status, 'failed',
    nullif(trim(p_reason), ''),
    jsonb_build_object('slaBreached', v_breached)
  );
  if coalesce((v_refund->>'refunded')::boolean, false) then
    perform public.find_home_log_event(
      p_request_id, 'refunded', 'failed', 'failed',
      'Reembolso integral da prioridade em créditos.',
      jsonb_build_object('amount', v_refund->>'amount')
    );
  end if;
  perform public.write_audit_log(
    'find_home.failed', 'find_home_request', p_request_id::text,
    jsonb_build_object('reason', p_reason, 'slaBreached', v_breached, 'refund', v_refund)
  );

  return jsonb_build_object(
    'ok', true, 'requestId', p_request_id, 'status', 'failed',
    'slaBreached', v_breached, 'refund', v_refund
  );
end;
$$;

revoke all on function public.find_home_fail(uuid, text) from public;
grant execute on function public.find_home_fail(uuid, text) to authenticated;

-- 6.5 Cancelar (cliente antes do match) — draft|awaiting_payment|active → cancelled
--     Reembolso integral da prioridade em créditos se já foi cobrada.
create or replace function public.find_home_cancel(
  p_request_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.find_home_requests%rowtype;
  v_refund jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_request from public.find_home_requests where id = p_request_id and deleted_at is null;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.client_id <> v_actor
     and not public.user_has_permission(v_actor, 'finance.manage')
     and not public.user_has_permission(v_actor, 'admin.panel') then
    raise exception 'only the client can cancel';
  end if;
  if v_request.status not in ('draft', 'awaiting_payment', 'active') then
    raise exception 'request cannot be cancelled from % state (match already found)', v_request.status;
  end if;

  -- Cancelar antes do match: devolução integral da prioridade em créditos.
  v_refund := public.find_home_credit_refund(
    p_request_id, 1.00,
    'Encontrar Casa — cancelamento antes do match'
  );

  update public.find_home_requests
  set status = 'cancelled',
      cancelled_at = timezone('utc', now()),
      failure_reason = nullif(trim(p_reason), ''),
      kai_notes = coalesce(kai_notes, '') || ' Pedido cancelado pelo cliente antes do match.',
      updated_by = v_actor
  where id = p_request_id;

  perform public.find_home_log_event(
    p_request_id, 'cancelled', v_request.status, 'cancelled',
    nullif(trim(p_reason), ''), '{}'::jsonb
  );
  if coalesce((v_refund->>'refunded')::boolean, false) then
    perform public.find_home_log_event(
      p_request_id, 'refunded', 'cancelled', 'cancelled',
      'Reembolso integral da prioridade em créditos.',
      jsonb_build_object('amount', v_refund->>'amount')
    );
  end if;
  perform public.write_audit_log(
    'find_home.cancelled', 'find_home_request', p_request_id::text,
    jsonb_build_object('reason', p_reason, 'refund', v_refund)
  );

  return jsonb_build_object(
    'ok', true, 'requestId', p_request_id, 'status', 'cancelled', 'refund', v_refund
  );
end;
$$;

revoke all on function public.find_home_cancel(uuid, text) from public;
grant execute on function public.find_home_cancel(uuid, text) to authenticated;

-- 6.6 Verificar SLAs (finance.manage / admin, cron futuro) — marca breaches
create or replace function public.find_home_check_slas()
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
  if v_actor is null or not (
    public.user_has_permission(v_actor, 'finance.manage')
    or public.user_has_permission(v_actor, 'admin.panel')
  ) then
    raise exception 'finance.manage required';
  end if;

  for r in
    select id, status
    from public.find_home_requests
    where deleted_at is null
      and sla_breached = false
      and sla_due_at is not null
      and sla_due_at < timezone('utc', now())
      and status in ('active', 'matched')
  loop
    update public.find_home_requests set sla_breached = true, updated_by = v_actor where id = r.id;
    perform public.find_home_log_event(
      r.id, 'sla_breached', r.status, r.status, 'SLA de procura ultrapassado.', '{}'::jsonb
    );
    v_count := v_count + 1;
  end loop;

  perform public.write_audit_log(
    'find_home.sla_check', 'find_home_request', null,
    jsonb_build_object('breached', v_count)
  );

  return jsonb_build_object('ok', true, 'breached', v_count);
end;
$$;

revoke all on function public.find_home_check_slas() from public;
grant execute on function public.find_home_check_slas() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. Comentários
-- ═══════════════════════════════════════════════════════════════════════════

comment on table public.find_home_requests is
  'ADR-021: Pedido de procura prioritária (Encontrar Casa, Fase D2) sobre Kuteka Pay.';
comment on table public.find_home_events is
  'ADR-021: Timeline append-only do ciclo de vida da Encontrar Casa (Fase D2).';
comment on column public.find_home_requests.priority_amount_aoa is
  'ADR-021: Taxa de prioridade cobrada no arranque via Kuteka Pay (find_home.priority).';
comment on column public.find_home_requests.sla_due_at is
  'ADR-021: Prazo-limite de procura. find_home_check_slas marca breaches.';
