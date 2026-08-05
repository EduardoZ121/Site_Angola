-- Fase D5 — Assistência 24h
-- Ref: Arquitectura Financeira v1.0 · ADR-017 · ADR-018 · ADR-024
-- Fluxo: draft → awaiting_payment → active → in_progress → completed
--         draft | awaiting_payment | active → cancelled
--         active | in_progress → failed
-- Pagamentos e reembolsos usam exclusivamente Kuteka Pay + Ledger + créditos.

-- 0. Feature flag e preço
insert into public.platform_feature_flags (code, label, description, enabled) values
  ('assistencia_24h', 'Assistência 24h', 'Assistência urgente ao imóvel, disponível 24 horas', true)
on conflict (code) do update
set label = excluded.label,
    description = excluded.description;

do $$
declare
  v_product_id uuid;
begin
  insert into public.finance_products (
    code, name, description, category, pricing_model, buyer_roles,
    country_code, currency, kai_suggestible, active
  )
  values (
    'assistencia_24h.call', 'Assistência 24h',
    'Chamada de assistência urgente ao imóvel.',
    'protection', 'fixed', array['client'], 'AO', 'AOA', true, true
  )
  on conflict (code) do update
  set name = excluded.name,
      description = excluded.description,
      category = excluded.category,
      pricing_model = excluded.pricing_model,
      active = true;

  select id into v_product_id
  from public.finance_products
  where code = 'assistencia_24h.call';

  insert into public.finance_price_rules (
    product_id, code, label, amount, currency, charge_event, priority
  )
  values (
    v_product_id, 'assistencia_call', 'Assistência 24h — chamada',
    5000, 'AOA', 'on_purchase', 10
  )
  on conflict (product_id, code) do update
  set amount = excluded.amount,
      label = excluded.label,
      active = true;
end;
$$;

-- 1. Pedidos
create table if not exists public.assistencia_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  category text not null
    check (category in (
      'plumbing', 'electricity', 'locksmith', 'security',
      'water_damage', 'gas', 'other'
    )),
  urgency text not null
    check (urgency in ('urgent', 'emergency')),
  notes text not null
    check (char_length(trim(notes)) between 10 and 2000),
  property_id uuid references public.properties (id) on delete set null,
  status text not null default 'draft'
    check (status in (
      'draft', 'awaiting_payment', 'active', 'in_progress',
      'completed', 'cancelled', 'failed'
    )),
  payment_intent_id uuid references public.finance_payment_intents (id),
  call_fee_aoa numeric(14, 2),
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

create index if not exists assistencia_requests_client_idx
  on public.assistencia_requests (client_id, created_at desc)
  where deleted_at is null;
create index if not exists assistencia_requests_status_idx
  on public.assistencia_requests (status, urgency, created_at asc)
  where deleted_at is null;
create index if not exists assistencia_requests_operator_idx
  on public.assistencia_requests (operator_id, status)
  where deleted_at is null and status in ('active', 'in_progress');

drop trigger if exists assistencia_requests_set_updated_at on public.assistencia_requests;
create trigger assistencia_requests_set_updated_at
before update on public.assistencia_requests
for each row execute function public.set_updated_at();

alter table public.assistencia_requests enable row level security;

drop policy if exists assistencia_requests_select on public.assistencia_requests;
create policy assistencia_requests_select
  on public.assistencia_requests for select to authenticated
  using (
    deleted_at is null
    and (
      client_id = auth.uid()
      or public.user_has_permission(auth.uid(), 'agent.operate')
      or public.user_has_permission(auth.uid(), 'finance.manage')
    )
  );

-- 2. Timeline append-only
create table if not exists public.assistencia_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null
    references public.assistencia_requests (id) on delete cascade,
  event_type text not null
    check (event_type in (
      'created', 'payment_requested', 'activated', 'started', 'completed',
      'cancelled', 'failed', 'refunded', 'note'
    )),
  from_status text,
  to_status text,
  actor_id uuid references auth.users (id),
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists assistencia_events_request_idx
  on public.assistencia_events (request_id, created_at asc);

alter table public.assistencia_events enable row level security;

drop policy if exists assistencia_events_select on public.assistencia_events;
create policy assistencia_events_select
  on public.assistencia_events for select to authenticated
  using (
    exists (
      select 1
      from public.assistencia_requests r
      where r.id = request_id
        and r.deleted_at is null
        and (
          r.client_id = auth.uid()
          or public.user_has_permission(auth.uid(), 'agent.operate')
          or public.user_has_permission(auth.uid(), 'finance.manage')
        )
    )
  );

create or replace function public.assistencia_log_event(
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
  insert into public.assistencia_events (
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

revoke all on function public.assistencia_log_event(uuid, text, text, text, text, jsonb)
  from public;

-- 3. Reembolso integral em créditos
create or replace function public.assistencia_credit_refund(
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
  v_request public.assistencia_requests%rowtype;
  v_charge public.finance_ledger_entries%rowtype;
  v_amount numeric(14, 2);
  v_account_id uuid;
  v_balance numeric(14, 2);
  v_refund_id uuid;
  v_credit_tx uuid;
  v_refund_ledger uuid;
begin
  select * into v_request
  from public.assistencia_requests
  where id = p_request_id
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false, 'refunded', false, 'reason', 'request not found'
    );
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

  v_amount := round(coalesce(v_request.call_fee_aoa, v_charge.amount), 2);
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
    coalesce(nullif(trim(p_reason), ''), 'Assistência 24h — reembolso integral'),
    v_actor
  )
  returning id into v_refund_id;

  insert into public.finance_credit_accounts (
    user_id, balance, currency, country_code
  )
  values (v_request.client_id, 0, 'AOA', 'AO')
  on conflict (user_id) do nothing;

  select id, balance into v_account_id, v_balance
  from public.finance_credit_accounts
  where user_id = v_request.client_id
  for update;

  v_balance := coalesce(v_balance, 0) + v_amount;
  update public.finance_credit_accounts
  set balance = v_balance,
      updated_at = timezone('utc', now())
  where id = v_account_id;

  insert into public.finance_ledger_entries (
    entry_type, status, currency, amount, country_code,
    payer_type, payer_id, payee_type, payee_id, payment_intent_id,
    custody_mode, description, metadata, created_by, updated_by
  )
  values (
    'refund', 'captured', coalesce(v_charge.currency, 'AOA'), v_amount, 'AO',
    'platform', null, 'user', v_request.client_id, v_request.payment_intent_id,
    'none', 'Reembolso Assistência 24h — ' ||
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
    coalesce(nullif(trim(p_reason), ''), 'Reembolso Assistência 24h'),
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
  set status = 'refunded',
      updated_by = v_actor
  where id = v_charge.id;

  return jsonb_build_object(
    'ok', true, 'refunded', true, 'refundId', v_refund_id,
    'amount', v_amount, 'creditBalance', v_balance, 'pct', 1
  );
end;
$$;

revoke all on function public.assistencia_credit_refund(uuid, text) from public;

-- 4. Contexto e criação do rascunho
create or replace function public.assistencia_my_context()
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

revoke all on function public.assistencia_my_context() from public;
grant execute on function public.assistencia_my_context() to authenticated;

create or replace function public.create_assistencia_request(
  p_category text,
  p_urgency text,
  p_notes text,
  p_property_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_enabled boolean;
  v_request_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select enabled into v_enabled
  from public.platform_feature_flags
  where code = 'assistencia_24h';
  if coalesce(v_enabled, true) is false then
    raise exception 'assistencia_24h disabled';
  end if;

  if p_category not in (
    'plumbing', 'electricity', 'locksmith', 'security',
    'water_damage', 'gas', 'other'
  ) then
    raise exception 'invalid assistance category';
  end if;
  if p_urgency not in ('urgent', 'emergency') then
    raise exception 'invalid assistance urgency';
  end if;
  if char_length(trim(coalesce(p_notes, ''))) not between 10 and 2000 then
    raise exception 'notes must contain between 10 and 2000 characters';
  end if;

  if p_property_id is not null and not exists (
    select 1
    from public.properties p
    where p.id = p_property_id
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

  insert into public.assistencia_requests (
    client_id, category, urgency, notes, property_id, status,
    created_by, updated_by
  )
  values (
    v_actor, p_category, p_urgency, trim(p_notes), p_property_id, 'draft',
    v_actor, v_actor
  )
  returning id into v_request_id;

  perform public.assistencia_log_event(
    v_request_id, 'created', null, 'draft',
    'Pedido de Assistência 24h criado pelo cliente.',
    jsonb_build_object(
      'category', p_category, 'urgency', p_urgency, 'propertyId', p_property_id
    )
  );
  perform public.write_audit_log(
    'assistencia_24h.created', 'assistencia_request', v_request_id::text,
    jsonb_build_object('category', p_category, 'urgency', p_urgency)
  );

  return jsonb_build_object(
    'ok', true, 'requestId', v_request_id, 'status', 'draft'
  );
end;
$$;

revoke all on function public.create_assistencia_request(text, text, text, uuid)
  from public;
grant execute on function public.create_assistencia_request(text, text, text, uuid)
  to authenticated;

-- 5. Pagamento via Kuteka Pay
create or replace function public.assistencia_activate(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_enabled boolean;
  v_request public.assistencia_requests%rowtype;
  v_pay jsonb;
  v_intent_id uuid;
  v_amount numeric(14, 2);
  v_client_action text;
  v_captured boolean := false;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select enabled into v_enabled
  from public.platform_feature_flags
  where code = 'assistencia_24h';
  if coalesce(v_enabled, true) is false then
    raise exception 'assistencia_24h disabled';
  end if;

  select * into v_request
  from public.assistencia_requests
  where id = p_request_id
    and client_id = v_actor
    and deleted_at is null
  for update;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.status <> 'draft' then
    raise exception 'request must be draft to activate (%)', v_request.status;
  end if;

  update public.assistencia_requests
  set status = 'awaiting_payment',
      updated_by = v_actor
  where id = p_request_id;

  perform public.assistencia_log_event(
    p_request_id, 'payment_requested', 'draft', 'awaiting_payment',
    'Pagamento da chamada solicitado via Kuteka Pay.', '{}'::jsonb
  );

  v_pay := public.kuteka_pay_create_intent(
    p_product_code := 'assistencia_24h.call',
    p_module_code := 'assistencia_24h',
    p_purpose := 'call_fee',
    p_reference_type := 'assistencia_request',
    p_reference_id := p_request_id,
    p_urgency_band := null,
    p_gateway_code := 'sandbox',
    p_idempotency_key := 'assistencia-call-' || p_request_id::text,
    p_description := 'Assistência 24h — taxa de chamada',
    p_metadata := jsonb_build_object(
      'requestId', p_request_id,
      'category', v_request.category,
      'urgency', v_request.urgency,
      'propertyId', v_request.property_id
    ),
    p_amount_override := null
  );

  v_intent_id := (v_pay->>'paymentIntentId')::uuid;
  v_amount := coalesce((v_pay->>'amount')::numeric, 0);
  v_client_action := v_pay->'clientAction'->>'type';

  update public.assistencia_requests
  set payment_intent_id = v_intent_id,
      call_fee_aoa = v_amount,
      updated_by = v_actor
  where id = p_request_id;

  if v_client_action in ('auto_capture_ready', 'already_captured') then
    if v_client_action = 'auto_capture_ready' then
      perform public.kuteka_pay_capture(v_intent_id);
    end if;
    v_captured := true;

    update public.assistencia_requests
    set status = 'active',
        updated_by = v_actor
    where id = p_request_id;

    perform public.assistencia_log_event(
      p_request_id, 'activated', 'awaiting_payment', 'active',
      'Taxa capturada. Pedido disponível para operação.',
      jsonb_build_object('paymentIntentId', v_intent_id, 'amount', v_amount)
    );
  end if;

  perform public.write_audit_log(
    'assistencia_24h.activated', 'assistencia_request', p_request_id::text,
    jsonb_build_object(
      'paymentIntentId', v_intent_id, 'callFee', v_amount, 'captured', v_captured
    )
  );

  return jsonb_build_object(
    'ok', true,
    'requestId', p_request_id,
    'status', case when v_captured then 'active' else 'awaiting_payment' end,
    'callFee', v_amount,
    'payment', v_pay
  );
end;
$$;

revoke all on function public.assistencia_activate(uuid) from public;
grant execute on function public.assistencia_activate(uuid) to authenticated;

-- 6. Ciclo operacional
create or replace function public.assistencia_start(
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
  v_request public.assistencia_requests%rowtype;
begin
  if v_actor is null or not (
    public.user_has_permission(v_actor, 'agent.operate')
    or public.user_has_permission(v_actor, 'finance.manage')
  ) then
    raise exception 'agent.operate or finance.manage required';
  end if;

  select * into v_request
  from public.assistencia_requests
  where id = p_request_id and deleted_at is null
  for update;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.status <> 'active' then
    raise exception 'request must be active to start (%)', v_request.status;
  end if;

  update public.assistencia_requests
  set status = 'in_progress',
      operator_id = v_actor,
      operator_notes = nullif(trim(p_note), ''),
      started_at = timezone('utc', now()),
      updated_by = v_actor
  where id = p_request_id;

  perform public.assistencia_log_event(
    p_request_id, 'started', 'active', 'in_progress',
    coalesce(nullif(trim(p_note), ''), 'Assistência iniciada pelo operador.'),
    '{}'::jsonb
  );
  perform public.write_audit_log(
    'assistencia_24h.started', 'assistencia_request', p_request_id::text,
    '{}'::jsonb
  );

  return jsonb_build_object(
    'ok', true, 'requestId', p_request_id, 'status', 'in_progress'
  );
end;
$$;

revoke all on function public.assistencia_start(uuid, text) from public;
grant execute on function public.assistencia_start(uuid, text) to authenticated;

create or replace function public.assistencia_complete(
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
  v_request public.assistencia_requests%rowtype;
begin
  if v_actor is null or not (
    public.user_has_permission(v_actor, 'agent.operate')
    or public.user_has_permission(v_actor, 'finance.manage')
  ) then
    raise exception 'agent.operate or finance.manage required';
  end if;

  select * into v_request
  from public.assistencia_requests
  where id = p_request_id and deleted_at is null
  for update;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.status <> 'in_progress' then
    raise exception 'request must be in progress to complete (%)', v_request.status;
  end if;

  update public.assistencia_requests
  set status = 'completed',
      operator_id = coalesce(operator_id, v_actor),
      operator_notes = coalesce(nullif(trim(p_note), ''), operator_notes),
      completed_at = timezone('utc', now()),
      updated_by = v_actor
  where id = p_request_id;

  perform public.assistencia_log_event(
    p_request_id, 'completed', 'in_progress', 'completed',
    coalesce(nullif(trim(p_note), ''), 'Assistência concluída pelo operador.'),
    '{}'::jsonb
  );
  perform public.write_audit_log(
    'assistencia_24h.completed', 'assistencia_request', p_request_id::text,
    '{}'::jsonb
  );

  return jsonb_build_object(
    'ok', true, 'requestId', p_request_id, 'status', 'completed'
  );
end;
$$;

revoke all on function public.assistencia_complete(uuid, text) from public;
grant execute on function public.assistencia_complete(uuid, text) to authenticated;

create or replace function public.assistencia_cancel(
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
  v_request public.assistencia_requests%rowtype;
  v_refund jsonb;
  v_intent_status text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_request
  from public.assistencia_requests
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

  v_refund := public.assistencia_credit_refund(
    p_request_id, 'Assistência 24h — cancelamento antes da execução'
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

  update public.assistencia_requests
  set status = 'cancelled',
      cancelled_at = timezone('utc', now()),
      failure_reason = nullif(trim(p_reason), ''),
      updated_by = v_actor
  where id = p_request_id;

  perform public.assistencia_log_event(
    p_request_id, 'cancelled', v_request.status, 'cancelled',
    coalesce(nullif(trim(p_reason), ''), 'Pedido cancelado antes da execução.'),
    '{}'::jsonb
  );
  if coalesce((v_refund->>'refunded')::boolean, false) then
    perform public.assistencia_log_event(
      p_request_id, 'refunded', 'cancelled', 'cancelled',
      'Taxa de chamada devolvida integralmente em créditos.',
      jsonb_build_object('amount', v_refund->>'amount')
    );
  end if;
  perform public.write_audit_log(
    'assistencia_24h.cancelled', 'assistencia_request', p_request_id::text,
    jsonb_build_object('reason', p_reason, 'refund', v_refund)
  );

  return jsonb_build_object(
    'ok', true, 'requestId', p_request_id, 'status', 'cancelled',
    'refund', v_refund
  );
end;
$$;

revoke all on function public.assistencia_cancel(uuid, text) from public;
grant execute on function public.assistencia_cancel(uuid, text) to authenticated;

create or replace function public.assistencia_fail(
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
  v_request public.assistencia_requests%rowtype;
  v_refund jsonb;
begin
  if v_actor is null or not (
    public.user_has_permission(v_actor, 'agent.operate')
    or public.user_has_permission(v_actor, 'finance.manage')
  ) then
    raise exception 'agent.operate or finance.manage required';
  end if;

  select * into v_request
  from public.assistencia_requests
  where id = p_request_id and deleted_at is null
  for update;
  if not found then
    raise exception 'request not found';
  end if;
  if v_request.status not in ('active', 'in_progress') then
    raise exception 'request cannot fail from % state', v_request.status;
  end if;

  v_refund := public.assistencia_credit_refund(
    p_request_id, 'Assistência 24h — serviço não concluído'
  );

  update public.assistencia_requests
  set status = 'failed',
      failed_at = timezone('utc', now()),
      failure_reason = nullif(trim(p_reason), ''),
      operator_id = coalesce(operator_id, v_actor),
      updated_by = v_actor
  where id = p_request_id;

  perform public.assistencia_log_event(
    p_request_id, 'failed', v_request.status, 'failed',
    coalesce(nullif(trim(p_reason), ''), 'Assistência não concluída.'),
    '{}'::jsonb
  );
  if coalesce((v_refund->>'refunded')::boolean, false) then
    perform public.assistencia_log_event(
      p_request_id, 'refunded', 'failed', 'failed',
      'Taxa de chamada devolvida integralmente em créditos.',
      jsonb_build_object('amount', v_refund->>'amount')
    );
  end if;
  perform public.write_audit_log(
    'assistencia_24h.failed', 'assistencia_request', p_request_id::text,
    jsonb_build_object('reason', p_reason, 'refund', v_refund)
  );

  return jsonb_build_object(
    'ok', true, 'requestId', p_request_id, 'status', 'failed',
    'refund', v_refund
  );
end;
$$;

revoke all on function public.assistencia_fail(uuid, text) from public;
grant execute on function public.assistencia_fail(uuid, text) to authenticated;

comment on table public.assistencia_requests is
  'ADR-024: Pedidos urgentes da Assistência 24h sobre Kuteka Pay e Ledger.';
comment on table public.assistencia_events is
  'ADR-024: Timeline append-only da Assistência 24h.';
comment on column public.assistencia_requests.call_fee_aoa is
  'ADR-024: Taxa única call_fee do produto assistencia_24h.call.';
