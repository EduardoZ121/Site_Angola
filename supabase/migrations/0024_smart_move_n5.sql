-- Fase D1 — Mudança Inteligente N5
-- Ref: Arquitectura Financeira v1.0 · ADR-015 · ADR-017 · ADR-018 · ADR-019 · ADR-020
-- Fecha o ciclo ponta a ponta da Mudança Inteligente sobre a MESMA infraestrutura
-- financeira (Ledger + Kuteka Pay + reembolsos/créditos). Nenhum caminho de
-- pagamento isolado — abertura e sucesso são payment intents do motor unificado.
--
-- Fluxo (N5):
-- draft → awaiting_payment → active → matched → completed | cancelled | failed
--   · abertura: cobrada no arranque (opening_fee)
--   · sucesso: cobrada APENAS quando a Kuteka encontra solução aceite (success_fee)
--   · reembolso/créditos: se a Kuteka falha o SLA (política por urgência)
--
-- Custódia continua desligada (custody_mode = none). Sandbox apenas nesta fase.
-- Aditivo (Core v1 freeze respeitado): apenas novas colunas/tabelas/RPCs.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. smart_move_requests — colunas operacionais (montantes, SLA, matching)
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.smart_move_requests
  add column if not exists opening_amount_aoa numeric(14, 2),
  add column if not exists success_amount_aoa numeric(14, 2),
  add column if not exists success_charged_at timestamptz,
  add column if not exists matched_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists failure_reason text,
  add column if not exists sla_hours int,
  add column if not exists sla_due_at timestamptz,
  add column if not exists sla_breached boolean not null default false,
  add column if not exists accepted_match boolean not null default false,
  add column if not exists match_notes text;

create index if not exists smart_move_requests_sla_idx
  on public.smart_move_requests (sla_due_at)
  where deleted_at is null and sla_breached = false;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. smart_move_events — timeline append-only (transições, notas, actor)
--    Mesmo padrão de service_order_events (ADR-019).
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.smart_move_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.smart_move_requests (id) on delete cascade,
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

create index if not exists smart_move_events_request_idx
  on public.smart_move_events (request_id, created_at desc);

alter table public.smart_move_events enable row level security;

-- Leitura: cliente dono do pedido ou operadores (finance/admin/agente/propriedades).
drop policy if exists smart_move_events_select on public.smart_move_events;
create policy smart_move_events_select
  on public.smart_move_events for select to authenticated
  using (
    exists (
      select 1
      from public.smart_move_requests r
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

-- Helper interno de escrita de eventos (não exposto a authenticated).
create or replace function public.smart_move_log_event(
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
  insert into public.smart_move_events (
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

revoke all on function public.smart_move_log_event(uuid, text, text, text, text, jsonb) from public;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Políticas de SLA e reembolso (por urgência) — documentadas no ADR-020
-- ═══════════════════════════════════════════════════════════════════════════

-- Horas de SLA por banda de urgência (dias úteis × 8h — valores razoáveis N5).
create or replace function public.smart_move_sla_hours(p_urgency text)
returns int
language sql
immutable
as $$
  select case p_urgency
    when 'planned_90' then 720
    when 'priority_60' then 480
    when 'urgent_30' then 240
    when 'emergency_14' then 120
    else 240
  end;
$$;

-- Percentagem de reembolso da taxa de abertura quando a Kuteka FALHA (por urgência):
-- quanto mais urgente (e mais cara a abertura), maior a devolução da confiança.
create or replace function public.smart_move_fail_refund_pct(p_urgency text)
returns numeric
language sql
immutable
as $$
  select case p_urgency
    when 'emergency_14' then 1.00
    when 'urgent_30' then 0.75
    when 'priority_60' then 0.60
    when 'planned_90' then 0.50
    else 0.50
  end;
$$;

-- Reembolso da taxa de abertura em CRÉDITOS Kuteka, reutilizando as tabelas
-- financeiras genéricas (finance_refunds + finance_credit_* + Ledger). Interno:
-- os RPCs de smart move (security definer) já autorizam o chamador, por isso este
-- helper não repete a barreira finance.manage (que barraria o cliente a cancelar).
create or replace function public.smart_move_credit_refund(
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
  v_request public.smart_move_requests%rowtype;
  v_charge public.finance_ledger_entries%rowtype;
  v_amount numeric(14, 2);
  v_pct numeric := greatest(least(coalesce(p_pct, 0), 1), 0);
  v_account_id uuid;
  v_balance numeric(14, 2);
  v_refund_id uuid;
  v_credit_tx uuid;
  v_refund_ledger uuid;
begin
  select * into v_request from public.smart_move_requests where id = p_request_id;
  if not found then
    return jsonb_build_object('ok', false, 'refunded', false, 'reason', 'request not found');
  end if;
  if v_request.opening_payment_intent_id is null or v_pct <= 0 then
    return jsonb_build_object('ok', true, 'refunded', false);
  end if;

  -- Lançamento de cobrança da abertura (fonte para o reembolso).
  select * into v_charge
  from public.finance_ledger_entries
  where payment_intent_id = v_request.opening_payment_intent_id
    and entry_type = 'charge'
  order by created_at asc
  limit 1;
  if not found or v_charge.status = 'refunded' then
    return jsonb_build_object('ok', true, 'refunded', false);
  end if;

  v_amount := round(coalesce(v_request.opening_amount_aoa, v_charge.amount) * v_pct, 2);
  if v_amount <= 0 then
    return jsonb_build_object('ok', true, 'refunded', false);
  end if;

  -- Registo de reembolso (modo créditos).
  insert into public.finance_refunds (
    ledger_entry_id, payment_intent_id, user_id, amount, currency,
    mode, status, reason, created_by
  )
  values (
    v_charge.id, v_request.opening_payment_intent_id, v_request.client_id, v_amount,
    coalesce(v_charge.currency, 'AOA'), 'credits', 'pending',
    coalesce(nullif(trim(p_reason), ''), 'Mudança Inteligente — reembolso da abertura'), v_actor
  )
  returning id into v_refund_id;

  -- Créditos Kuteka na conta do cliente (mesma mecânica de finance_grant_credits).
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
    'platform', null, 'user', v_request.client_id, v_request.opening_payment_intent_id,
    'none', 'Reembolso Mudança Inteligente — ' || coalesce(nullif(trim(p_reason), ''), 'créditos'),
    jsonb_build_object('refundId', v_refund_id, 'mode', 'credits', 'requestId', p_request_id, 'pct', v_pct),
    v_actor, v_actor
  )
  returning id into v_refund_ledger;

  insert into public.finance_credit_transactions (
    account_id, user_id, direction, amount, balance_after, reason, ledger_entry_id, created_by
  )
  values (
    v_account_id, v_request.client_id, 'grant', v_amount, v_balance,
    coalesce(nullif(trim(p_reason), ''), 'Reembolso Mudança Inteligente'), v_refund_ledger, v_actor
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

revoke all on function public.smart_move_credit_refund(uuid, numeric, text) from public;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Contexto do utilizador (para decidir o painel de matching na UI)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.smart_move_my_context()
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

revoke all on function public.smart_move_my_context() from public;
grant execute on function public.smart_move_my_context() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. create_smart_move_request — refactor para o motor unificado Kuteka Pay
--    (module_code = smart_move, purpose = opening_fee, produto smart_move.open)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.create_smart_move_request(
  p_urgency_band text,
  p_target_exit_on date,
  p_contract_id uuid default null,
  p_preferences jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_contract public.property_contracts%rowtype;
  v_request_id uuid;
  v_pay jsonb;
  v_enabled boolean;
  v_sla int;
  v_due timestamptz;
  v_intent_id uuid;
  v_amount numeric(14, 2);
  v_client_action text;
  v_captured boolean := false;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select enabled into v_enabled from public.platform_feature_flags where code = 'smart_move';
  if coalesce(v_enabled, true) is false then
    raise exception 'smart_move disabled';
  end if;

  if p_urgency_band not in ('planned_90', 'priority_60', 'urgent_30', 'emergency_14') then
    raise exception 'invalid urgency';
  end if;

  if p_contract_id is not null then
    select * into v_contract
    from public.property_contracts
    where id = p_contract_id and deleted_at is null and client_id = v_actor;
    if not found then
      raise exception 'contract not found';
    end if;

    perform public.set_contract_exit_intent(
      p_contract_id,
      'confirmed',
      p_target_exit_on,
      'smart_move',
      'Mudança Inteligente — urgência ' || p_urgency_band
    );
  end if;

  v_sla := public.smart_move_sla_hours(p_urgency_band);
  v_due := timezone('utc', now()) + make_interval(hours => v_sla);

  insert into public.smart_move_requests (
    client_id, contract_id, property_id, urgency_band, target_exit_on,
    status, preferences, sla_hours, sla_due_at,
    kai_notes, created_by, updated_by
  )
  values (
    v_actor,
    p_contract_id,
    v_contract.property_id,
    p_urgency_band,
    p_target_exit_on,
    'awaiting_payment',
    coalesce(p_preferences, '{}'::jsonb),
    v_sla,
    v_due,
    'KAI: procura iniciada conforme urgência ' || p_urgency_band ||
      '. Parceiro e agentes serão notificados após o pagamento da abertura.',
    v_actor,
    v_actor
  )
  returning id into v_request_id;

  perform public.smart_move_log_event(
    v_request_id, 'created', null, 'awaiting_payment',
    'Pedido criado pelo cliente.',
    jsonb_build_object('urgency', p_urgency_band, 'slaHours', v_sla)
  );

  -- Taxa de abertura via motor unificado Kuteka Pay (nenhum caminho isolado).
  v_pay := public.kuteka_pay_create_intent(
    p_product_code := 'smart_move.open',
    p_module_code := 'smart_move',
    p_purpose := 'opening_fee',
    p_reference_type := 'smart_move_request',
    p_reference_id := v_request_id,
    p_urgency_band := p_urgency_band,
    p_gateway_code := 'sandbox',
    p_idempotency_key := 'smove-open-' || v_request_id::text,
    p_description := 'Mudança Inteligente — taxa de abertura (' || p_urgency_band || ')',
    p_metadata := jsonb_build_object('requestId', v_request_id, 'urgency', p_urgency_band),
    p_amount_override := null
  );

  v_intent_id := (v_pay->>'paymentIntentId')::uuid;
  v_amount := coalesce((v_pay->>'amount')::numeric, 0);
  v_client_action := v_pay->'clientAction'->>'type';

  update public.smart_move_requests
  set opening_payment_intent_id = v_intent_id,
      opening_amount_aoa = v_amount,
      updated_by = v_actor
  where id = v_request_id;

  -- Sandbox: captura automática da abertura → activa o pipeline (efeitos).
  if v_client_action in ('auto_capture_ready', 'already_captured') then
    if v_client_action = 'auto_capture_ready' then
      perform public.kuteka_pay_capture(v_intent_id);
    end if;
    v_captured := true;

    update public.smart_move_requests
    set status = 'active',
        partner_notified_at = timezone('utc', now()),
        agent_task_created_at = timezone('utc', now()),
        kai_notes = kai_notes ||
          ' Abertura capturada (sandbox). Pipeline activo: parceiro notificado, ' ||
          'tarefa de agente criada, previsões financeiras actualizadas.',
        updated_by = v_actor
    where id = v_request_id;

    perform public.smart_move_log_event(
      v_request_id, 'activated', 'awaiting_payment', 'active',
      'Abertura capturada (sandbox). Parceiro e agentes notificados.',
      jsonb_build_object('paymentIntentId', v_intent_id, 'amount', v_amount)
    );
  end if;

  perform public.write_audit_log(
    'smart_move.created',
    'smart_move_request',
    v_request_id::text,
    jsonb_build_object('urgency', p_urgency_band, 'openingAmount', v_amount, 'captured', v_captured)
  );

  return jsonb_build_object(
    'ok', true,
    'requestId', v_request_id,
    'status', case when v_captured then 'active' else 'awaiting_payment' end,
    'openingAmount', v_amount,
    'payment', v_pay
  );
end;
$$;

revoke all on function public.create_smart_move_request(text, date, uuid, jsonb) from public;
grant execute on function public.create_smart_move_request(text, date, uuid, jsonb) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. RPCs do ciclo de matching (security definer)
-- ═══════════════════════════════════════════════════════════════════════════

-- 6.1 Registar match (agente / admin / finance.manage) — active → matched
create or replace function public.smart_move_match(
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
  v_request public.smart_move_requests%rowtype;
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

  select * into v_request from public.smart_move_requests where id = p_request_id and deleted_at is null;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.status <> 'active' then
    raise exception 'request must be active to match (%).', v_request.status;
  end if;

  update public.smart_move_requests
  set status = 'matched',
      matched_property_id = p_matched_property_id,
      match_notes = nullif(trim(p_notes), ''),
      matched_at = timezone('utc', now()),
      accepted_match = false,
      kai_notes = coalesce(kai_notes, '') || ' Solução encontrada — a aguardar decisão do cliente.',
      updated_by = v_actor
  where id = p_request_id;

  perform public.smart_move_log_event(
    p_request_id, 'matched', 'active', 'matched',
    nullif(trim(p_notes), ''),
    jsonb_build_object('matchedPropertyId', p_matched_property_id)
  );
  perform public.write_audit_log(
    'smart_move.matched', 'smart_move_request', p_request_id::text,
    jsonb_build_object('matchedPropertyId', p_matched_property_id)
  );

  return jsonb_build_object('ok', true, 'requestId', p_request_id, 'status', 'matched');
end;
$$;

revoke all on function public.smart_move_match(uuid, uuid, text) from public;
grant execute on function public.smart_move_match(uuid, uuid, text) to authenticated;

-- 6.2 Aceitar match (cliente) — cobra a taxa de SUCESSO via Kuteka Pay → completed
create or replace function public.smart_move_accept_match(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.smart_move_requests%rowtype;
  v_pay jsonb;
  v_intent_id uuid;
  v_amount numeric(14, 2);
  v_client_action text;
  v_captured boolean := false;
  v_breached boolean;
  v_now timestamptz := timezone('utc', now());
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_request from public.smart_move_requests where id = p_request_id and deleted_at is null;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.client_id <> v_actor and not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'only the client can accept the match';
  end if;
  if v_request.status <> 'matched' then
    raise exception 'request has no pending match (%).', v_request.status;
  end if;

  -- Taxa de sucesso APENAS agora (a Kuteka encontrou solução aceite).
  v_pay := public.kuteka_pay_create_intent(
    p_product_code := 'smart_move.success',
    p_module_code := 'smart_move',
    p_purpose := 'success_fee',
    p_reference_type := 'smart_move_request',
    p_reference_id := p_request_id,
    p_urgency_band := v_request.urgency_band,
    p_gateway_code := 'sandbox',
    p_idempotency_key := 'smove-success-' || p_request_id::text,
    p_description := 'Mudança Inteligente — taxa de sucesso (' || v_request.urgency_band || ')',
    p_metadata := jsonb_build_object('requestId', p_request_id, 'urgency', v_request.urgency_band),
    p_amount_override := null
  );

  v_intent_id := (v_pay->>'paymentIntentId')::uuid;
  v_amount := coalesce((v_pay->>'amount')::numeric, 0);
  v_client_action := v_pay->'clientAction'->>'type';

  if v_client_action in ('auto_capture_ready', 'already_captured') then
    if v_client_action = 'auto_capture_ready' then
      perform public.kuteka_pay_capture(v_intent_id);
    end if;
    v_captured := true;
  end if;

  v_breached := v_request.sla_due_at is not null and v_now > v_request.sla_due_at;

  update public.smart_move_requests
  set accepted_match = true,
      success_payment_intent_id = v_intent_id,
      success_amount_aoa = v_amount,
      success_charged_at = case when v_captured then v_now else null end,
      status = 'completed',
      completed_at = v_now,
      sla_breached = v_breached,
      kai_notes = coalesce(kai_notes, '') || ' Match aceite. Taxa de sucesso cobrada. Ciclo concluído.',
      updated_by = v_actor
  where id = p_request_id;

  perform public.smart_move_log_event(
    p_request_id, 'accepted', 'matched', 'matched',
    'Cliente aceitou a solução da Kuteka.', jsonb_build_object('paymentIntentId', v_intent_id)
  );
  perform public.smart_move_log_event(
    p_request_id, 'completed', 'matched', 'completed',
    'Taxa de sucesso cobrada via Kuteka Pay.',
    jsonb_build_object('amount', v_amount, 'captured', v_captured, 'slaBreached', v_breached)
  );
  perform public.write_audit_log(
    'smart_move.completed', 'smart_move_request', p_request_id::text,
    jsonb_build_object('successAmount', v_amount, 'captured', v_captured, 'slaBreached', v_breached)
  );

  return jsonb_build_object(
    'ok', true,
    'requestId', p_request_id,
    'status', 'completed',
    'successAmount', v_amount,
    'captured', v_captured,
    'slaBreached', v_breached,
    'payment', v_pay
  );
end;
$$;

revoke all on function public.smart_move_accept_match(uuid) from public;
grant execute on function public.smart_move_accept_match(uuid) to authenticated;

-- 6.3 Rejeitar match (cliente) — matched → active (sem cobrança de sucesso)
create or replace function public.smart_move_reject_match(
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
  v_request public.smart_move_requests%rowtype;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_request from public.smart_move_requests where id = p_request_id and deleted_at is null;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.client_id <> v_actor and not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'only the client can reject the match';
  end if;
  if v_request.status <> 'matched' then
    raise exception 'request has no pending match (%).', v_request.status;
  end if;

  update public.smart_move_requests
  set status = 'active',
      accepted_match = false,
      matched_property_id = null,
      match_notes = null,
      matched_at = null,
      kai_notes = coalesce(kai_notes, '') || ' Solução recusada pelo cliente. Procura retomada.',
      updated_by = v_actor
  where id = p_request_id;

  perform public.smart_move_log_event(
    p_request_id, 'rejected', 'matched', 'active',
    nullif(trim(p_reason), ''), '{}'::jsonb
  );
  perform public.write_audit_log(
    'smart_move.rejected', 'smart_move_request', p_request_id::text,
    jsonb_build_object('reason', p_reason)
  );

  return jsonb_build_object('ok', true, 'requestId', p_request_id, 'status', 'active');
end;
$$;

revoke all on function public.smart_move_reject_match(uuid, text) from public;
grant execute on function public.smart_move_reject_match(uuid, text) to authenticated;

-- 6.4 Falhar (agente / admin / finance.manage) — active|matched → failed
--     Reembolso parcial da abertura em créditos, por urgência (política ADR-020).
create or replace function public.smart_move_fail(
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
  v_request public.smart_move_requests%rowtype;
  v_now timestamptz := timezone('utc', now());
  v_breached boolean;
  v_pct numeric;
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

  select * into v_request from public.smart_move_requests where id = p_request_id and deleted_at is null;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.status not in ('active', 'matched') then
    raise exception 'request cannot fail from % state', v_request.status;
  end if;

  v_breached := v_request.sla_due_at is not null and v_now > v_request.sla_due_at;
  v_pct := public.smart_move_fail_refund_pct(v_request.urgency_band);

  v_refund := public.smart_move_credit_refund(
    p_request_id, v_pct,
    'Mudança Inteligente — SLA não cumprido (' || v_request.urgency_band || ')'
  );

  update public.smart_move_requests
  set status = 'failed',
      failed_at = v_now,
      failure_reason = nullif(trim(p_reason), ''),
      sla_breached = v_breached,
      kai_notes = coalesce(kai_notes, '') || ' Kuteka não cumpriu o SLA. Reembolso em créditos aplicado.',
      updated_by = v_actor
  where id = p_request_id;

  perform public.smart_move_log_event(
    p_request_id, 'failed', v_request.status, 'failed',
    nullif(trim(p_reason), ''),
    jsonb_build_object('slaBreached', v_breached, 'refundPct', v_pct)
  );
  if coalesce((v_refund->>'refunded')::boolean, false) then
    perform public.smart_move_log_event(
      p_request_id, 'refunded', 'failed', 'failed',
      'Reembolso parcial da abertura em créditos.',
      jsonb_build_object('amount', v_refund->>'amount', 'pct', v_pct)
    );
  end if;
  perform public.write_audit_log(
    'smart_move.failed', 'smart_move_request', p_request_id::text,
    jsonb_build_object('reason', p_reason, 'slaBreached', v_breached, 'refund', v_refund)
  );

  return jsonb_build_object(
    'ok', true, 'requestId', p_request_id, 'status', 'failed',
    'slaBreached', v_breached, 'refund', v_refund
  );
end;
$$;

revoke all on function public.smart_move_fail(uuid, text) from public;
grant execute on function public.smart_move_fail(uuid, text) to authenticated;

-- 6.5 Cancelar (cliente antes do match) — draft|awaiting_payment|active → cancelled
--     Reembolso integral da abertura em créditos se já foi cobrada.
create or replace function public.smart_move_cancel(
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
  v_request public.smart_move_requests%rowtype;
  v_refund jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_request from public.smart_move_requests where id = p_request_id and deleted_at is null;
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

  -- Cancelar antes do match: devolução integral da abertura em créditos.
  v_refund := public.smart_move_credit_refund(
    p_request_id, 1.00,
    'Mudança Inteligente — cancelamento antes do match'
  );

  update public.smart_move_requests
  set status = 'cancelled',
      cancelled_at = timezone('utc', now()),
      failure_reason = nullif(trim(p_reason), ''),
      kai_notes = coalesce(kai_notes, '') || ' Pedido cancelado pelo cliente antes do match.',
      updated_by = v_actor
  where id = p_request_id;

  perform public.smart_move_log_event(
    p_request_id, 'cancelled', v_request.status, 'cancelled',
    nullif(trim(p_reason), ''), '{}'::jsonb
  );
  if coalesce((v_refund->>'refunded')::boolean, false) then
    perform public.smart_move_log_event(
      p_request_id, 'refunded', 'cancelled', 'cancelled',
      'Reembolso integral da abertura em créditos.',
      jsonb_build_object('amount', v_refund->>'amount')
    );
  end if;
  perform public.write_audit_log(
    'smart_move.cancelled', 'smart_move_request', p_request_id::text,
    jsonb_build_object('reason', p_reason, 'refund', v_refund)
  );

  return jsonb_build_object(
    'ok', true, 'requestId', p_request_id, 'status', 'cancelled', 'refund', v_refund
  );
end;
$$;

revoke all on function public.smart_move_cancel(uuid, text) from public;
grant execute on function public.smart_move_cancel(uuid, text) to authenticated;

-- 6.6 Verificar SLAs (finance.manage / admin, cron futuro) — marca breaches
create or replace function public.smart_move_check_slas()
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
    from public.smart_move_requests
    where deleted_at is null
      and sla_breached = false
      and sla_due_at is not null
      and sla_due_at < timezone('utc', now())
      and status in ('active', 'matched')
  loop
    update public.smart_move_requests set sla_breached = true, updated_by = v_actor where id = r.id;
    perform public.smart_move_log_event(
      r.id, 'sla_breached', r.status, r.status, 'SLA de matching ultrapassado.', '{}'::jsonb
    );
    v_count := v_count + 1;
  end loop;

  perform public.write_audit_log(
    'smart_move.sla_check', 'smart_move_request', null,
    jsonb_build_object('breached', v_count)
  );

  return jsonb_build_object('ok', true, 'breached', v_count);
end;
$$;

revoke all on function public.smart_move_check_slas() from public;
grant execute on function public.smart_move_check_slas() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. Comentários
-- ═══════════════════════════════════════════════════════════════════════════

comment on table public.smart_move_events is
  'ADR-020: Timeline append-only do ciclo de vida da Mudança Inteligente (Fase D1).';
comment on column public.smart_move_requests.opening_amount_aoa is
  'ADR-020: Taxa de abertura cobrada no arranque via Kuteka Pay (smart_move.open).';
comment on column public.smart_move_requests.success_amount_aoa is
  'ADR-020: Taxa de sucesso — cobrada APENAS quando a Kuteka encontra solução aceite.';
comment on column public.smart_move_requests.sla_due_at is
  'ADR-020: Prazo-limite de matching por urgência. smart_move_check_slas marca breaches.';
