-- Fase D4 — Garantia Kuteka (subscrição opcional N5)
-- Ref: Arquitectura Financeira v1.0 · ADR-017 · ADR-018 · ADR-023
-- Reutiliza exclusivamente Kuteka Pay + Ledger + reembolsos/créditos.
--
-- Fluxo: draft → awaiting_payment → active → cancelled | past_due | failed
-- Política N5: cancelamento em awaiting_payment, ou no mesmo dia UTC da
-- activação, devolve 100 % em créditos. Depois desse dia não há reembolso.

-- ═══════════════════════════════════════════════════════════════════════════
-- 0. Feature flag e preço N5
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.platform_feature_flags (code, label, description, enabled) values
  ('garantia', 'Garantia Kuteka', 'Cobertura mensal opcional para arrendamentos', true)
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
    'garantia.monthly', 'Garantia Kuteka (mensal)',
    'Cobertura mensal opcional para o arrendamento.',
    'protection', 'subscription', array['client', 'patrimonial_partner'],
    'AO', 'AOA', true, true
  )
  on conflict (code) do update
  set name = excluded.name,
      description = excluded.description,
      category = excluded.category,
      pricing_model = excluded.pricing_model,
      active = true;

  select id into v_product_id
  from public.finance_products
  where code = 'garantia.monthly';

  insert into public.finance_price_rules (
    product_id, code, label, amount, currency, charge_event, priority
  )
  values (
    v_product_id, 'garantia_monthly', 'Garantia mensal', 3500, 'AOA',
    'subscription_cycle', 10
  )
  on conflict (product_id, code) do update
  set amount = excluded.amount,
      label = excluded.label,
      active = true;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Subscrições e leitura protegida por RLS
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.garantia_subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  contract_id uuid references public.property_contracts (id) on delete set null,
  status text not null default 'draft'
    check (status in (
      'draft', 'awaiting_payment', 'active', 'cancelled', 'past_due', 'failed'
    )),
  payment_intent_id uuid references public.finance_payment_intents (id),
  monthly_amount_aoa numeric(14, 2),
  coverage_starts_at timestamptz,
  coverage_ends_at timestamptz,
  cancelled_at timestamptz,
  past_due_at timestamptz,
  failed_at timestamptz,
  status_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

create index if not exists garantia_subscriptions_client_idx
  on public.garantia_subscriptions (client_id, created_at desc)
  where deleted_at is null;
create index if not exists garantia_subscriptions_status_idx
  on public.garantia_subscriptions (status, updated_at asc)
  where deleted_at is null;
create unique index if not exists garantia_subscriptions_open_contract_idx
  on public.garantia_subscriptions (client_id, contract_id)
  where deleted_at is null
    and contract_id is not null
    and status in ('draft', 'awaiting_payment', 'active', 'past_due');

drop trigger if exists garantia_subscriptions_set_updated_at on public.garantia_subscriptions;
create trigger garantia_subscriptions_set_updated_at
before update on public.garantia_subscriptions
for each row execute function public.set_updated_at();

alter table public.garantia_subscriptions enable row level security;

drop policy if exists garantia_subscriptions_select on public.garantia_subscriptions;
create policy garantia_subscriptions_select
  on public.garantia_subscriptions for select to authenticated
  using (
    deleted_at is null
    and (
      client_id = auth.uid()
      or public.user_has_permission(auth.uid(), 'finance.manage')
      or public.user_has_permission(auth.uid(), 'finance.read')
    )
  );

-- Mutações são exclusivamente feitas pelas RPCs security definer.

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Timeline append-only
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.garantia_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null
    references public.garantia_subscriptions (id) on delete cascade,
  event_type text not null
    check (event_type in (
      'created', 'payment_requested', 'activated', 'cancelled',
      'past_due', 'failed', 'refunded', 'note'
    )),
  from_status text,
  to_status text,
  actor_id uuid references auth.users (id),
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists garantia_events_subscription_idx
  on public.garantia_events (subscription_id, created_at asc);

alter table public.garantia_events enable row level security;

drop policy if exists garantia_events_select on public.garantia_events;
create policy garantia_events_select
  on public.garantia_events for select to authenticated
  using (
    exists (
      select 1
      from public.garantia_subscriptions s
      where s.id = subscription_id
        and s.deleted_at is null
        and (
          s.client_id = auth.uid()
          or public.user_has_permission(auth.uid(), 'finance.manage')
          or public.user_has_permission(auth.uid(), 'finance.read')
        )
    )
  );

create or replace function public.garantia_log_event(
  p_subscription_id uuid,
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
  insert into public.garantia_events (
    subscription_id, event_type, from_status, to_status, actor_id, note, metadata
  )
  values (
    p_subscription_id, p_event_type, p_from_status, p_to_status, auth.uid(),
    nullif(trim(p_note), ''), coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.garantia_log_event(uuid, text, text, text, text, jsonb)
  from public;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Reembolso integral em créditos
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.garantia_credit_refund(
  p_subscription_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_subscription public.garantia_subscriptions%rowtype;
  v_charge public.finance_ledger_entries%rowtype;
  v_amount numeric(14, 2);
  v_account_id uuid;
  v_balance numeric(14, 2);
  v_refund_id uuid;
  v_credit_tx uuid;
  v_refund_ledger uuid;
begin
  select * into v_subscription
  from public.garantia_subscriptions
  where id = p_subscription_id
  for update;

  if not found then
    return jsonb_build_object(
      'ok', false, 'refunded', false, 'reason', 'subscription not found'
    );
  end if;
  if v_subscription.payment_intent_id is null then
    return jsonb_build_object('ok', true, 'refunded', false);
  end if;

  select * into v_charge
  from public.finance_ledger_entries
  where payment_intent_id = v_subscription.payment_intent_id
    and entry_type = 'charge'
  order by created_at asc
  limit 1
  for update;

  if not found or v_charge.status <> 'captured' then
    return jsonb_build_object('ok', true, 'refunded', false);
  end if;

  v_amount := round(coalesce(v_subscription.monthly_amount_aoa, v_charge.amount), 2);
  if v_amount <= 0 then
    return jsonb_build_object('ok', true, 'refunded', false);
  end if;

  insert into public.finance_refunds (
    ledger_entry_id, payment_intent_id, user_id, amount, currency,
    mode, status, reason, created_by
  )
  values (
    v_charge.id, v_subscription.payment_intent_id, v_subscription.client_id,
    v_amount, coalesce(v_charge.currency, 'AOA'), 'credits', 'pending',
    coalesce(nullif(trim(p_reason), ''), 'Garantia Kuteka — reembolso integral'),
    v_actor
  )
  returning id into v_refund_id;

  insert into public.finance_credit_accounts (user_id, balance, currency, country_code)
  values (v_subscription.client_id, 0, 'AOA', 'AO')
  on conflict (user_id) do nothing;

  select id, balance into v_account_id, v_balance
  from public.finance_credit_accounts
  where user_id = v_subscription.client_id
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
    'platform', null, 'user', v_subscription.client_id,
    v_subscription.payment_intent_id, 'none',
    'Reembolso Garantia Kuteka — ' ||
      coalesce(nullif(trim(p_reason), ''), 'créditos'),
    jsonb_build_object(
      'refundId', v_refund_id, 'mode', 'credits',
      'subscriptionId', p_subscription_id, 'pct', 1
    ),
    v_actor, v_actor
  )
  returning id into v_refund_ledger;

  insert into public.finance_credit_transactions (
    account_id, user_id, direction, amount, balance_after, reason,
    ledger_entry_id, created_by
  )
  values (
    v_account_id, v_subscription.client_id, 'grant', v_amount, v_balance,
    coalesce(nullif(trim(p_reason), ''), 'Reembolso Garantia Kuteka'),
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

revoke all on function public.garantia_credit_refund(uuid, text) from public;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Contexto e criação do rascunho
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.garantia_my_context()
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
    'canOperate', public.user_has_permission(v_actor, 'finance.manage')
  );
end;
$$;

revoke all on function public.garantia_my_context() from public;
grant execute on function public.garantia_my_context() to authenticated;

create or replace function public.create_garantia_subscription(
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
  v_property_id uuid := p_property_id;
  v_subscription_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select enabled into v_enabled
  from public.platform_feature_flags
  where code = 'garantia';
  if coalesce(v_enabled, true) is false then
    raise exception 'garantia disabled';
  end if;

  if p_contract_id is not null then
    select * into v_contract
    from public.property_contracts
    where id = p_contract_id
      and deleted_at is null
      and (client_id = v_actor or partner_id = v_actor);
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
        p.owner_id = v_actor
        or exists (
          select 1
          from public.property_contracts c
          where c.property_id = p.id
            and c.deleted_at is null
            and (c.client_id = v_actor or c.partner_id = v_actor)
        )
      )
  ) then
    raise exception 'property not found';
  end if;

  insert into public.garantia_subscriptions (
    client_id, property_id, contract_id, status, created_by, updated_by
  )
  values (
    v_actor, v_property_id, p_contract_id, 'draft', v_actor, v_actor
  )
  returning id into v_subscription_id;

  perform public.garantia_log_event(
    v_subscription_id, 'created', null, 'draft',
    'Rascunho da Garantia Kuteka criado.',
    jsonb_build_object('propertyId', v_property_id, 'contractId', p_contract_id)
  );
  perform public.write_audit_log(
    'garantia.created', 'garantia_subscription', v_subscription_id::text,
    jsonb_build_object('propertyId', v_property_id, 'contractId', p_contract_id)
  );

  return jsonb_build_object(
    'ok', true, 'subscriptionId', v_subscription_id, 'status', 'draft'
  );
end;
$$;

revoke all on function public.create_garantia_subscription(uuid, uuid) from public;
grant execute on function public.create_garantia_subscription(uuid, uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. Activação pelo cliente via Kuteka Pay
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.garantia_activate(p_subscription_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_enabled boolean;
  v_subscription public.garantia_subscriptions%rowtype;
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
  where code = 'garantia';
  if coalesce(v_enabled, true) is false then
    raise exception 'garantia disabled';
  end if;

  select * into v_subscription
  from public.garantia_subscriptions
  where id = p_subscription_id
    and client_id = v_actor
    and deleted_at is null
  for update;
  if not found then
    raise exception 'subscription not found';
  end if;
  if v_subscription.status <> 'draft' then
    raise exception 'subscription must be draft to activate (%)', v_subscription.status;
  end if;

  update public.garantia_subscriptions
  set status = 'awaiting_payment',
      updated_by = v_actor
  where id = p_subscription_id;

  perform public.garantia_log_event(
    p_subscription_id, 'payment_requested', 'draft', 'awaiting_payment',
    'Pagamento mensal solicitado via Kuteka Pay.',
    '{}'::jsonb
  );

  v_pay := public.kuteka_pay_create_intent(
    p_product_code := 'garantia.monthly',
    p_module_code := 'garantia',
    p_purpose := 'subscription',
    p_reference_type := 'garantia_subscription',
    p_reference_id := p_subscription_id,
    p_urgency_band := null,
    p_gateway_code := 'sandbox',
    p_idempotency_key := 'garantia-monthly-' || p_subscription_id::text,
    p_description := 'Garantia Kuteka — subscrição mensal',
    p_metadata := jsonb_build_object(
      'subscriptionId', p_subscription_id,
      'propertyId', v_subscription.property_id,
      'contractId', v_subscription.contract_id
    ),
    p_amount_override := null
  );

  v_intent_id := (v_pay->>'paymentIntentId')::uuid;
  v_amount := coalesce((v_pay->>'amount')::numeric, 0);
  v_client_action := v_pay->'clientAction'->>'type';

  update public.garantia_subscriptions
  set payment_intent_id = v_intent_id,
      monthly_amount_aoa = v_amount,
      updated_by = v_actor
  where id = p_subscription_id;

  if v_client_action in ('auto_capture_ready', 'already_captured') then
    if v_client_action = 'auto_capture_ready' then
      perform public.kuteka_pay_capture(v_intent_id);
    end if;
    v_captured := true;

    update public.garantia_subscriptions
    set status = 'active',
        coverage_starts_at = timezone('utc', now()),
        coverage_ends_at = timezone('utc', now()) + interval '1 month',
        updated_by = v_actor
    where id = p_subscription_id;

    perform public.garantia_log_event(
      p_subscription_id, 'activated', 'awaiting_payment', 'active',
      'Pagamento capturado. Cobertura mensal activa.',
      jsonb_build_object('paymentIntentId', v_intent_id, 'amount', v_amount)
    );
  end if;

  perform public.write_audit_log(
    'garantia.activated', 'garantia_subscription', p_subscription_id::text,
    jsonb_build_object(
      'paymentIntentId', v_intent_id, 'amount', v_amount, 'captured', v_captured
    )
  );

  return jsonb_build_object(
    'ok', true,
    'subscriptionId', p_subscription_id,
    'status', case when v_captured then 'active' else 'awaiting_payment' end,
    'monthlyAmount', v_amount,
    'payment', v_pay
  );
end;
$$;

revoke all on function public.garantia_activate(uuid) from public;
grant execute on function public.garantia_activate(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Cancelamento e estados de cobrança
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.garantia_cancel(
  p_subscription_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_subscription public.garantia_subscriptions%rowtype;
  v_refund jsonb := jsonb_build_object('ok', true, 'refunded', false);
  v_refund_eligible boolean := false;
  v_intent_status text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_subscription
  from public.garantia_subscriptions
  where id = p_subscription_id
    and deleted_at is null
  for update;
  if not found then
    raise exception 'subscription not found';
  end if;
  if v_subscription.client_id <> v_actor
     and not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'only the client or finance manager can cancel';
  end if;
  if v_subscription.status not in ('draft', 'awaiting_payment', 'active', 'past_due') then
    raise exception 'subscription cannot be cancelled from % state', v_subscription.status;
  end if;

  v_refund_eligible :=
    v_subscription.status = 'awaiting_payment'
    or (
      v_subscription.status = 'active'
      and v_subscription.coverage_starts_at is not null
      and (v_subscription.coverage_starts_at at time zone 'UTC')::date =
        timezone('utc', now())::date
    );

  if v_refund_eligible then
    v_refund := public.garantia_credit_refund(
      p_subscription_id, 'Garantia Kuteka — cancelamento no período de graça'
    );
  end if;

  if v_subscription.payment_intent_id is not null
     and not coalesce((v_refund->>'refunded')::boolean, false) then
    select status into v_intent_status
    from public.finance_payment_intents
    where id = v_subscription.payment_intent_id;
    if v_intent_status in ('created', 'awaiting_payment', 'processing') then
      perform public.kuteka_pay_cancel(v_subscription.payment_intent_id);
    end if;
  end if;

  update public.garantia_subscriptions
  set status = 'cancelled',
      coverage_ends_at = case
        when status = 'active' then timezone('utc', now())
        else coverage_ends_at
      end,
      cancelled_at = timezone('utc', now()),
      status_reason = nullif(trim(p_reason), ''),
      updated_by = v_actor
  where id = p_subscription_id;

  perform public.garantia_log_event(
    p_subscription_id, 'cancelled', v_subscription.status, 'cancelled',
    coalesce(nullif(trim(p_reason), ''), 'Cobertura cancelada pelo cliente.'),
    jsonb_build_object('refundEligible', v_refund_eligible)
  );
  if coalesce((v_refund->>'refunded')::boolean, false) then
    perform public.garantia_log_event(
      p_subscription_id, 'refunded', 'cancelled', 'cancelled',
      'Mensalidade devolvida integralmente em créditos.',
      jsonb_build_object('amount', v_refund->>'amount')
    );
  end if;
  perform public.write_audit_log(
    'garantia.cancelled', 'garantia_subscription', p_subscription_id::text,
    jsonb_build_object(
      'reason', p_reason, 'refundEligible', v_refund_eligible, 'refund', v_refund
    )
  );

  return jsonb_build_object(
    'ok', true, 'subscriptionId', p_subscription_id,
    'status', 'cancelled', 'refundEligible', v_refund_eligible, 'refund', v_refund
  );
end;
$$;

revoke all on function public.garantia_cancel(uuid, text) from public;
grant execute on function public.garantia_cancel(uuid, text) to authenticated;

create or replace function public.garantia_mark_payment_status(
  p_subscription_id uuid,
  p_status text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_subscription public.garantia_subscriptions%rowtype;
begin
  if v_actor is null or not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'finance.manage required';
  end if;
  if p_status not in ('past_due', 'failed') then
    raise exception 'status must be past_due or failed';
  end if;

  select * into v_subscription
  from public.garantia_subscriptions
  where id = p_subscription_id
    and deleted_at is null
  for update;
  if not found then
    raise exception 'subscription not found';
  end if;
  if v_subscription.status not in ('awaiting_payment', 'active', 'past_due') then
    raise exception 'payment status cannot change from %', v_subscription.status;
  end if;

  update public.garantia_subscriptions
  set status = p_status,
      past_due_at = case when p_status = 'past_due'
        then timezone('utc', now()) else past_due_at end,
      failed_at = case when p_status = 'failed'
        then timezone('utc', now()) else failed_at end,
      coverage_ends_at = case when p_status = 'failed'
        then timezone('utc', now()) else coverage_ends_at end,
      status_reason = nullif(trim(p_reason), ''),
      updated_by = v_actor
  where id = p_subscription_id;

  perform public.garantia_log_event(
    p_subscription_id, p_status, v_subscription.status, p_status,
    coalesce(nullif(trim(p_reason), ''), 'Estado de cobrança actualizado.'),
    '{}'::jsonb
  );
  perform public.write_audit_log(
    'garantia.' || p_status, 'garantia_subscription', p_subscription_id::text,
    jsonb_build_object('reason', p_reason)
  );

  return jsonb_build_object(
    'ok', true, 'subscriptionId', p_subscription_id, 'status', p_status
  );
end;
$$;

revoke all on function public.garantia_mark_payment_status(uuid, text, text) from public;
grant execute on function public.garantia_mark_payment_status(uuid, text, text)
  to authenticated;

comment on table public.garantia_subscriptions is
  'ADR-023: Subscrições mensais da Garantia Kuteka sobre Kuteka Pay e Ledger.';
comment on table public.garantia_events is
  'ADR-023: Timeline append-only da Garantia Kuteka.';
comment on column public.garantia_subscriptions.monthly_amount_aoa is
  'ADR-023: Mensalidade cotada pelo produto garantia.monthly.';
