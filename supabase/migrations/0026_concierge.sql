-- Fase D3 — Concierge Kuteka (serviço pay-per-use)
-- Ref: Arquitectura Financeira v1.0 · ADR-017 · ADR-018 · ADR-020 · ADR-021 · ADR-022
-- Reutiliza a stack financeira partilhada: Kuteka Pay + Ledger + reembolsos/créditos.
--
-- Fluxo:
-- draft → awaiting_payment → active → in_progress → completed
--                                      └──────────→ failed
-- draft | awaiting_payment | active → cancelled
--
-- Uma única taxa de serviço (`service_fee`) pelo produto `concierge.request`.
-- Cancelamento antes de `in_progress` e falha operacional devolvem 100 % em créditos.

-- ═══════════════════════════════════════════════════════════════════════════
-- 0. Feature flag
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.platform_feature_flags (code, label, description, enabled) values
  ('concierge', 'Concierge Kuteka', 'Pedidos assistidos de serviços à medida', true)
on conflict (code) do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Pedidos e leitura protegida por RLS
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.concierge_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  category text not null
    check (category in (
      'housing_guidance', 'contract_support', 'document_support',
      'move_coordination', 'property_support', 'other'
    )),
  notes text not null
    check (char_length(trim(notes)) between 10 and 2000),
  property_id uuid references public.properties (id) on delete set null,
  contract_id uuid references public.property_contracts (id) on delete set null,
  status text not null default 'draft'
    check (status in (
      'draft', 'awaiting_payment', 'active', 'in_progress',
      'completed', 'cancelled', 'failed'
    )),
  payment_intent_id uuid references public.finance_payment_intents (id),
  service_fee_aoa numeric(14, 2),
  operator_id uuid references auth.users (id) on delete set null,
  operator_notes text,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

create index if not exists concierge_requests_client_idx
  on public.concierge_requests (client_id, created_at desc)
  where deleted_at is null;
create index if not exists concierge_requests_status_idx
  on public.concierge_requests (status, created_at asc)
  where deleted_at is null;
create index if not exists concierge_requests_operator_idx
  on public.concierge_requests (operator_id, status)
  where deleted_at is null and status in ('active', 'in_progress');

drop trigger if exists concierge_requests_set_updated_at on public.concierge_requests;
create trigger concierge_requests_set_updated_at
before update on public.concierge_requests
for each row execute function public.set_updated_at();

alter table public.concierge_requests enable row level security;

drop policy if exists concierge_requests_select on public.concierge_requests;
create policy concierge_requests_select
  on public.concierge_requests for select to authenticated
  using (
    deleted_at is null
    and (
      client_id = auth.uid()
      or public.user_has_permission(auth.uid(), 'agent.operate')
      or public.user_has_permission(auth.uid(), 'finance.manage')
    )
  );

-- Criação e transições são exclusivamente feitas pelas RPCs security definer.

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Timeline append-only
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.concierge_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.concierge_requests (id) on delete cascade,
  event_type text not null
    check (event_type in (
      'created', 'activated', 'started', 'completed', 'cancelled',
      'failed', 'refunded', 'note'
    )),
  from_status text,
  to_status text,
  actor_id uuid references auth.users (id),
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists concierge_events_request_idx
  on public.concierge_events (request_id, created_at asc);

alter table public.concierge_events enable row level security;

drop policy if exists concierge_events_select on public.concierge_events;
create policy concierge_events_select
  on public.concierge_events for select to authenticated
  using (
    exists (
      select 1
      from public.concierge_requests r
      where r.id = request_id
        and r.deleted_at is null
        and (
          r.client_id = auth.uid()
          or public.user_has_permission(auth.uid(), 'agent.operate')
          or public.user_has_permission(auth.uid(), 'finance.manage')
        )
    )
  );

create or replace function public.concierge_log_event(
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
  insert into public.concierge_events (
    request_id, event_type, from_status, to_status, actor_id, note, metadata
  )
  values (
    p_request_id, p_event_type, p_from_status, p_to_status, auth.uid(),
    nullif(trim(p_note), ''), coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.concierge_log_event(uuid, text, text, text, text, jsonb) from public;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Reembolso integral em créditos sobre o lançamento capturado
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.concierge_credit_refund(
  p_request_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.concierge_requests%rowtype;
  v_charge public.finance_ledger_entries%rowtype;
  v_amount numeric(14, 2);
  v_account_id uuid;
  v_balance numeric(14, 2);
  v_refund_id uuid;
  v_credit_tx uuid;
  v_refund_ledger uuid;
begin
  select * into v_request
  from public.concierge_requests
  where id = p_request_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'refunded', false, 'reason', 'request not found');
  end if;
  if v_request.payment_intent_id is null then
    return jsonb_build_object('ok', true, 'refunded', false);
  end if;

  select * into v_charge
  from public.finance_ledger_entries
  where payment_intent_id = v_request.payment_intent_id
    and entry_type = 'charge'
  order by created_at asc
  limit 1
  for update;

  if not found or v_charge.status <> 'captured' then
    return jsonb_build_object('ok', true, 'refunded', false);
  end if;

  v_amount := round(coalesce(v_request.service_fee_aoa, v_charge.amount), 2);
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
    coalesce(nullif(trim(p_reason), ''), 'Concierge Kuteka — reembolso integral'), v_actor
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
    'none', 'Reembolso Concierge Kuteka — ' ||
      coalesce(nullif(trim(p_reason), ''), 'créditos'),
    jsonb_build_object(
      'refundId', v_refund_id, 'mode', 'credits',
      'requestId', p_request_id, 'pct', 1
    ),
    v_actor, v_actor
  )
  returning id into v_refund_ledger;

  insert into public.finance_credit_transactions (
    account_id, user_id, direction, amount, balance_after, reason,
    ledger_entry_id, created_by
  )
  values (
    v_account_id, v_request.client_id, 'grant', v_amount, v_balance,
    coalesce(nullif(trim(p_reason), ''), 'Reembolso Concierge Kuteka'),
    v_refund_ledger, v_actor
  )
  returning id into v_credit_tx;

  update public.finance_refunds
  set status = 'completed',
      credit_transaction_id = v_credit_tx,
      refund_ledger_entry_id = v_refund_ledger,
      resolved_by = v_actor,
      resolved_at = timezone('utc', now())
  where id = v_refund_id;

  update public.finance_ledger_entries
  set status = 'refunded', updated_by = v_actor
  where id = v_charge.id;

  return jsonb_build_object(
    'ok', true,
    'refunded', true,
    'refundId', v_refund_id,
    'amount', v_amount,
    'creditBalance', v_balance,
    'pct', 1
  );
end;
$$;

revoke all on function public.concierge_credit_refund(uuid, text) from public;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Contexto e criação do pedido
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.concierge_my_context()
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

  return jsonb_build_object(
    'ok', true,
    'canOperate',
      public.user_has_permission(v_actor, 'agent.operate')
      or public.user_has_permission(v_actor, 'finance.manage')
  );
end;
$$;

revoke all on function public.concierge_my_context() from public;
grant execute on function public.concierge_my_context() to authenticated;

create or replace function public.create_concierge_request(
  p_category text,
  p_notes text,
  p_property_id uuid default null,
  p_contract_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_enabled boolean;
  v_contract public.property_contracts%rowtype;
  v_request_id uuid;
  v_pay jsonb;
  v_intent_id uuid;
  v_amount numeric(14, 2);
  v_client_action text;
  v_captured boolean := false;
  v_property_id uuid := p_property_id;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select enabled into v_enabled
  from public.platform_feature_flags
  where code = 'concierge';
  if coalesce(v_enabled, true) is false then
    raise exception 'concierge disabled';
  end if;

  if p_category not in (
    'housing_guidance', 'contract_support', 'document_support',
    'move_coordination', 'property_support', 'other'
  ) then
    raise exception 'invalid concierge category';
  end if;
  if char_length(trim(coalesce(p_notes, ''))) not between 10 and 2000 then
    raise exception 'notes must contain between 10 and 2000 characters';
  end if;

  if p_contract_id is not null then
    select * into v_contract
    from public.property_contracts
    where id = p_contract_id
      and client_id = v_actor
      and deleted_at is null;
    if not found then
      raise exception 'contract not found';
    end if;
    if v_property_id is not null and v_property_id <> v_contract.property_id then
      raise exception 'property does not match contract';
    end if;
    v_property_id := coalesce(v_property_id, v_contract.property_id);
  end if;

  if v_property_id is not null and not exists (
    select 1
    from public.properties p
    where p.id = v_property_id
      and p.deleted_at is null
      and (
        p.status = 'active'
        or p.owner_id = v_actor
        or exists (
          select 1
          from public.property_contracts c
          where c.property_id = p.id
            and c.client_id = v_actor
            and c.deleted_at is null
        )
      )
  ) then
    raise exception 'property not found';
  end if;

  insert into public.concierge_requests (
    client_id, category, notes, property_id, contract_id, status,
    created_by, updated_by
  )
  values (
    v_actor, p_category, trim(p_notes), v_property_id, p_contract_id,
    'awaiting_payment', v_actor, v_actor
  )
  returning id into v_request_id;

  perform public.concierge_log_event(
    v_request_id, 'created', null, 'awaiting_payment',
    'Pedido Concierge criado pelo cliente.',
    jsonb_build_object('category', p_category)
  );

  v_pay := public.kuteka_pay_create_intent(
    p_product_code := 'concierge.request',
    p_module_code := 'concierge',
    p_purpose := 'service_fee',
    p_reference_type := 'concierge_request',
    p_reference_id := v_request_id,
    p_urgency_band := null,
    p_gateway_code := 'sandbox',
    p_idempotency_key := 'concierge-service-' || v_request_id::text,
    p_description := 'Concierge Kuteka — taxa de serviço',
    p_metadata := jsonb_build_object(
      'requestId', v_request_id,
      'category', p_category,
      'propertyId', v_property_id,
      'contractId', p_contract_id
    ),
    p_amount_override := null
  );

  v_intent_id := (v_pay->>'paymentIntentId')::uuid;
  v_amount := coalesce((v_pay->>'amount')::numeric, 0);
  v_client_action := v_pay->'clientAction'->>'type';

  update public.concierge_requests
  set payment_intent_id = v_intent_id,
      service_fee_aoa = v_amount,
      updated_by = v_actor
  where id = v_request_id;

  if v_client_action in ('auto_capture_ready', 'already_captured') then
    if v_client_action = 'auto_capture_ready' then
      perform public.kuteka_pay_capture(v_intent_id);
    end if;
    v_captured := true;

    update public.concierge_requests
    set status = 'active', updated_by = v_actor
    where id = v_request_id;

    perform public.concierge_log_event(
      v_request_id, 'activated', 'awaiting_payment', 'active',
      'Taxa de serviço capturada (sandbox). Pedido disponível para operação.',
      jsonb_build_object('paymentIntentId', v_intent_id, 'amount', v_amount)
    );
  end if;

  perform public.write_audit_log(
    'concierge.created',
    'concierge_request',
    v_request_id::text,
    jsonb_build_object(
      'category', p_category,
      'serviceFee', v_amount,
      'captured', v_captured
    )
  );

  return jsonb_build_object(
    'ok', true,
    'requestId', v_request_id,
    'status', case when v_captured then 'active' else 'awaiting_payment' end,
    'serviceFee', v_amount,
    'payment', v_pay
  );
end;
$$;

revoke all on function public.create_concierge_request(text, text, uuid, uuid) from public;
grant execute on function public.create_concierge_request(text, text, uuid, uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. Ciclo operacional
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.concierge_start(
  p_request_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.concierge_requests%rowtype;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if not (
    public.user_has_permission(v_actor, 'agent.operate')
    or public.user_has_permission(v_actor, 'finance.manage')
  ) then
    raise exception 'agent.operate or finance.manage required';
  end if;

  select * into v_request
  from public.concierge_requests
  where id = p_request_id and deleted_at is null
  for update;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.status <> 'active' then
    raise exception 'request must be active to start (%)', v_request.status;
  end if;

  update public.concierge_requests
  set status = 'in_progress',
      operator_id = v_actor,
      operator_notes = nullif(trim(p_note), ''),
      started_at = timezone('utc', now()),
      updated_by = v_actor
  where id = p_request_id;

  perform public.concierge_log_event(
    p_request_id, 'started', 'active', 'in_progress',
    coalesce(nullif(trim(p_note), ''), 'Atendimento iniciado pelo operador.'),
    '{}'::jsonb
  );
  perform public.write_audit_log(
    'concierge.started', 'concierge_request', p_request_id::text, '{}'::jsonb
  );

  return jsonb_build_object(
    'ok', true, 'requestId', p_request_id, 'status', 'in_progress'
  );
end;
$$;

revoke all on function public.concierge_start(uuid, text) from public;
grant execute on function public.concierge_start(uuid, text) to authenticated;

create or replace function public.concierge_complete(
  p_request_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_request public.concierge_requests%rowtype;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if not (
    public.user_has_permission(v_actor, 'agent.operate')
    or public.user_has_permission(v_actor, 'finance.manage')
  ) then
    raise exception 'agent.operate or finance.manage required';
  end if;

  select * into v_request
  from public.concierge_requests
  where id = p_request_id and deleted_at is null
  for update;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.status <> 'in_progress' then
    raise exception 'request must be in progress to complete (%)', v_request.status;
  end if;

  update public.concierge_requests
  set status = 'completed',
      operator_id = coalesce(operator_id, v_actor),
      operator_notes = coalesce(nullif(trim(p_note), ''), operator_notes),
      completed_at = timezone('utc', now()),
      updated_by = v_actor
  where id = p_request_id;

  perform public.concierge_log_event(
    p_request_id, 'completed', 'in_progress', 'completed',
    coalesce(nullif(trim(p_note), ''), 'Atendimento concluído pelo operador.'),
    '{}'::jsonb
  );
  perform public.write_audit_log(
    'concierge.completed', 'concierge_request', p_request_id::text, '{}'::jsonb
  );

  return jsonb_build_object(
    'ok', true, 'requestId', p_request_id, 'status', 'completed'
  );
end;
$$;

revoke all on function public.concierge_complete(uuid, text) from public;
grant execute on function public.concierge_complete(uuid, text) to authenticated;

create or replace function public.concierge_cancel(
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
  v_request public.concierge_requests%rowtype;
  v_refund jsonb;
  v_intent_status text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_request
  from public.concierge_requests
  where id = p_request_id and deleted_at is null
  for update;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.client_id <> v_actor
     and not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'only the client or finance manager can cancel';
  end if;
  if v_request.status not in ('draft', 'awaiting_payment', 'active') then
    raise exception 'request cannot be cancelled from % state', v_request.status;
  end if;

  v_refund := public.concierge_credit_refund(
    p_request_id, 'Concierge Kuteka — cancelamento antes do atendimento'
  );

  if v_request.payment_intent_id is not null
     and not coalesce((v_refund->>'refunded')::boolean, false) then
    select status into v_intent_status
    from public.finance_payment_intents
    where id = v_request.payment_intent_id;
    if v_intent_status in ('created', 'awaiting_payment', 'processing') then
      perform public.kuteka_pay_cancel(v_request.payment_intent_id);
    end if;
  end if;

  update public.concierge_requests
  set status = 'cancelled',
      cancelled_at = timezone('utc', now()),
      failure_reason = nullif(trim(p_reason), ''),
      updated_by = v_actor
  where id = p_request_id;

  perform public.concierge_log_event(
    p_request_id, 'cancelled', v_request.status, 'cancelled',
    coalesce(nullif(trim(p_reason), ''), 'Pedido cancelado antes do atendimento.'),
    '{}'::jsonb
  );
  if coalesce((v_refund->>'refunded')::boolean, false) then
    perform public.concierge_log_event(
      p_request_id, 'refunded', 'cancelled', 'cancelled',
      'Taxa de serviço devolvida integralmente em créditos.',
      jsonb_build_object('amount', v_refund->>'amount')
    );
  end if;
  perform public.write_audit_log(
    'concierge.cancelled',
    'concierge_request',
    p_request_id::text,
    jsonb_build_object('reason', p_reason, 'refund', v_refund)
  );

  return jsonb_build_object(
    'ok', true,
    'requestId', p_request_id,
    'status', 'cancelled',
    'refund', v_refund
  );
end;
$$;

revoke all on function public.concierge_cancel(uuid, text) from public;
grant execute on function public.concierge_cancel(uuid, text) to authenticated;

create or replace function public.concierge_fail(
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
  v_request public.concierge_requests%rowtype;
  v_refund jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if not (
    public.user_has_permission(v_actor, 'agent.operate')
    or public.user_has_permission(v_actor, 'finance.manage')
  ) then
    raise exception 'agent.operate or finance.manage required';
  end if;

  select * into v_request
  from public.concierge_requests
  where id = p_request_id and deleted_at is null
  for update;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.status not in ('active', 'in_progress') then
    raise exception 'request cannot fail from % state', v_request.status;
  end if;

  v_refund := public.concierge_credit_refund(
    p_request_id, 'Concierge Kuteka — serviço não concluído'
  );

  update public.concierge_requests
  set status = 'failed',
      failed_at = timezone('utc', now()),
      failure_reason = nullif(trim(p_reason), ''),
      operator_id = coalesce(operator_id, v_actor),
      updated_by = v_actor
  where id = p_request_id;

  perform public.concierge_log_event(
    p_request_id, 'failed', v_request.status, 'failed',
    coalesce(nullif(trim(p_reason), ''), 'Serviço não concluído.'),
    '{}'::jsonb
  );
  if coalesce((v_refund->>'refunded')::boolean, false) then
    perform public.concierge_log_event(
      p_request_id, 'refunded', 'failed', 'failed',
      'Taxa de serviço devolvida integralmente em créditos.',
      jsonb_build_object('amount', v_refund->>'amount')
    );
  end if;
  perform public.write_audit_log(
    'concierge.failed',
    'concierge_request',
    p_request_id::text,
    jsonb_build_object('reason', p_reason, 'refund', v_refund)
  );

  return jsonb_build_object(
    'ok', true,
    'requestId', p_request_id,
    'status', 'failed',
    'refund', v_refund
  );
end;
$$;

revoke all on function public.concierge_fail(uuid, text) from public;
grant execute on function public.concierge_fail(uuid, text) to authenticated;

comment on table public.concierge_requests is
  'ADR-022: Pedidos pay-per-use do Concierge Kuteka sobre Kuteka Pay e Ledger.';
comment on table public.concierge_events is
  'ADR-022: Timeline append-only do ciclo de vida do Concierge Kuteka.';
comment on column public.concierge_requests.service_fee_aoa is
  'ADR-022: Taxa única service_fee do produto concierge.request.';
