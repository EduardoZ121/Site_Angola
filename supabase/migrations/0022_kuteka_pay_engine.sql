-- Fase B — Kuteka Pay (motor de pagamento unificado)
-- Ref: Arquitectura Financeira v1.0 · nova ordem PO 2026-08-05 · ADR-018
-- Princípio: UMA arquitectura de pagamento usada por TODOS os módulos
-- (renda, reservas, mudança inteligente, concierge, contratos, avaliações,
-- serviços de prestadores, futuros). Os módulos nunca chamam SDKs de gateway
-- directamente — apenas RPCs kuteka_pay_* / finance_*.
-- O payment intent é a única fonte de verdade de uma tentativa de pagamento.
-- Trocar Multicaixa/EMIS/Stripe/Wise mais tarde NÃO exige reescrever módulos.
-- Custódia continua desligada (custody_mode = none). Sandbox apenas nesta fase.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Payment intents — colunas transversais do motor Kuteka Pay
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.finance_payment_intents
  add column if not exists module_code text not null default 'other',
  add column if not exists purpose text,
  add column if not exists reference_type text,
  add column if not exists reference_id uuid,
  add column if not exists adapter_code text not null default 'sandbox',
  add column if not exists idempotency_key text,
  add column if not exists expires_at timestamptz,
  add column if not exists captured_at timestamptz,
  add column if not exists failed_at timestamptz,
  add column if not exists failure_code text,
  add column if not exists failure_message text;

-- Adaptador de gateway (sandbox|multicaixa|emis|stripe|wise|bank_transfer)
alter table public.finance_payment_intents
  drop constraint if exists finance_payment_intents_adapter_code_check;
alter table public.finance_payment_intents
  add constraint finance_payment_intents_adapter_code_check
  check (adapter_code in ('sandbox', 'multicaixa', 'emis', 'stripe', 'wise', 'bank_transfer'));

-- idempotency_key único quando presente (múltiplos NULL permitidos)
create unique index if not exists finance_payment_intents_idempotency_key_idx
  on public.finance_payment_intents (idempotency_key)
  where idempotency_key is not null;

create index if not exists finance_payment_intents_reference_idx
  on public.finance_payment_intents (reference_type, reference_id);
create index if not exists finance_payment_intents_module_idx
  on public.finance_payment_intents (module_code, status);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. finance_pay_events — auditoria append-only do ciclo de vida do intent
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.finance_pay_events (
  id uuid primary key default gen_random_uuid(),
  payment_intent_id uuid not null references public.finance_payment_intents (id) on delete cascade,
  event_type text not null
    check (event_type in (
      'created', 'redirected', 'webhook', 'captured', 'failed', 'cancelled', 'expired'
    )),
  adapter_code text,
  status_after text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id)
);

create index if not exists finance_pay_events_intent_idx
  on public.finance_pay_events (payment_intent_id, created_at desc);

alter table public.finance_pay_events enable row level security;

-- Leitura: dono do intent, finance.read ou finance.manage
drop policy if exists finance_pay_events_select on public.finance_pay_events;
create policy finance_pay_events_select
  on public.finance_pay_events for select to authenticated
  using (
    public.user_has_permission(auth.uid(), 'finance.read')
    or public.user_has_permission(auth.uid(), 'finance.manage')
    or exists (
      select 1 from public.finance_payment_intents pi
      where pi.id = payment_intent_id and pi.user_id = auth.uid()
    )
  );

-- Escrita apenas via RPCs security definer (sem policy de insert direta).
-- Append-only: sem policies de update/delete.

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. finance_gateways — prioridade, gateway por omissão e allowlist de módulos
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.finance_gateways
  add column if not exists priority int not null default 100,
  add column if not exists is_default boolean not null default false,
  add column if not exists module_allowlist text[];

-- Apenas um gateway por omissão activo (índice parcial único sobre a coluna booleana)
create unique index if not exists finance_gateways_single_default_idx
  on public.finance_gateways (is_default)
  where is_default and deleted_at is null;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. RPC kuteka_pay_create_intent — cria intent + ledger pendente + pay_event
-- ═══════════════════════════════════════════════════════════════════════════

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
  p_metadata jsonb default '{}'::jsonb
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
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  -- Idempotência: se já existe intent com esta chave, devolve-o inalterado
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

  -- Preço via motor de cotação genérico
  v_quote := public.finance_quote_price(p_product_code, p_urgency_band, 'AO', 'AOA');
  if coalesce((v_quote->>'ok')::boolean, false) is not true then
    raise exception 'unable to quote product %', p_product_code;
  end if;

  v_amount := coalesce((v_quote->>'amount')::numeric, 0);
  v_currency := coalesce(v_quote->>'currency', 'AOA');
  v_product_id := (v_quote->>'productId')::uuid;
  v_rule_id := (v_quote->>'priceRuleId')::uuid;

  -- Selecção do gateway (explícito ou por omissão activo em sandbox)
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

  -- Allowlist de módulos (também para gateway explícito)
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
      'purpose', p_purpose, 'referenceType', p_reference_type, 'referenceId', p_reference_id
    ),
    v_actor
  );

  perform public.write_audit_log(
    'kuteka_pay.intent_created',
    'finance_payment_intent',
    v_intent_id::text,
    jsonb_build_object(
      'product', p_product_code, 'amount', v_amount, 'gateway', v_gateway.code,
      'module', v_module, 'sandbox', v_gateway.sandbox
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

revoke all on function public.kuteka_pay_create_intent(text, text, text, text, uuid, text, text, text, text, jsonb) from public;
grant execute on function public.kuteka_pay_create_intent(text, text, text, text, uuid, text, text, text, text, jsonb) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. RPC kuteka_pay_capture — captura (sucesso), ledger, fatura, pay_event
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.kuteka_pay_capture(p_intent_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_intent public.finance_payment_intents%rowtype;
  v_invoice_id uuid;
  v_number text;
  v_profile public.profiles%rowtype;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_intent
  from public.finance_payment_intents
  where id = p_intent_id;
  if not found then
    raise exception 'payment intent not found';
  end if;

  if v_intent.user_id is distinct from v_actor
     and not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'forbidden';
  end if;

  -- Idempotente: se já capturado, devolve a fatura existente
  if v_intent.status = 'succeeded' then
    select id, number into v_invoice_id, v_number
    from public.finance_invoices
    where payment_intent_id = v_intent.id
    order by created_at asc
    limit 1;
    return jsonb_build_object(
      'ok', true, 'status', 'succeeded', 'idempotent', true,
      'paymentIntentId', v_intent.id, 'invoiceId', v_invoice_id, 'invoiceNumber', v_number
    );
  end if;

  if v_intent.status in ('failed', 'cancelled', 'expired') then
    raise exception 'intent % is % and cannot be captured', v_intent.id, v_intent.status;
  end if;

  update public.finance_payment_intents
  set status = 'succeeded',
      captured_at = timezone('utc', now()),
      updated_by = v_actor,
      gateway_ref = coalesce(gateway_ref, upper(coalesce(adapter_code, 'sandbox')) || '-OK')
  where id = v_intent.id;

  update public.finance_ledger_entries
  set status = 'captured',
      updated_by = v_actor,
      gateway_ref = coalesce(gateway_ref, v_intent.gateway_ref)
  where payment_intent_id = v_intent.id
    and entry_type = 'charge';

  select * into v_profile from public.profiles where id = v_intent.user_id;

  v_number := 'KTK-INV-' || to_char(timezone('utc', now()), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.finance_invoices (
    number, user_id, payment_intent_id, status, currency, country_code,
    subtotal, tax_amount, total, buyer_snapshot, lines, created_by
  )
  values (
    v_number, v_intent.user_id, v_intent.id, 'paid', v_intent.currency,
    v_intent.country_code, v_intent.amount, 0, v_intent.amount,
    jsonb_build_object(
      'userId', v_intent.user_id,
      'legalFullName', v_profile.legal_full_name,
      'displayName', v_profile.display_name,
      'preferredName', v_profile.preferred_name
    ),
    jsonb_build_array(
      jsonb_build_object(
        'description', coalesce(v_intent.description, 'Serviço Kuteka'),
        'amount', v_intent.amount,
        'currency', v_intent.currency
      )
    ),
    v_actor
  )
  returning id into v_invoice_id;

  insert into public.finance_pay_events (
    payment_intent_id, event_type, adapter_code, status_after, payload, created_by
  )
  values (
    v_intent.id, 'captured', v_intent.adapter_code, 'succeeded',
    jsonb_build_object('invoiceId', v_invoice_id, 'invoiceNumber', v_number, 'amount', v_intent.amount),
    v_actor
  );

  perform public.write_audit_log(
    'kuteka_pay.captured',
    'finance_payment_intent',
    v_intent.id::text,
    jsonb_build_object('invoiceId', v_invoice_id, 'sandbox', v_intent.sandbox)
  );

  return jsonb_build_object(
    'ok', true,
    'status', 'succeeded',
    'idempotent', false,
    'paymentIntentId', v_intent.id,
    'invoiceId', v_invoice_id,
    'invoiceNumber', v_number
  );
end;
$$;

revoke all on function public.kuteka_pay_capture(uuid) from public;
grant execute on function public.kuteka_pay_capture(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. RPC kuteka_pay_fail — marca falha do intent + ledger + pay_event
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.kuteka_pay_fail(
  p_intent_id uuid,
  p_code text default null,
  p_message text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_intent public.finance_payment_intents%rowtype;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_intent
  from public.finance_payment_intents
  where id = p_intent_id;
  if not found then
    raise exception 'payment intent not found';
  end if;

  if v_intent.user_id is distinct from v_actor
     and not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'forbidden';
  end if;

  if v_intent.status = 'succeeded' then
    raise exception 'intent already captured';
  end if;

  update public.finance_payment_intents
  set status = 'failed',
      failed_at = timezone('utc', now()),
      failure_code = nullif(trim(p_code), ''),
      failure_message = nullif(trim(p_message), ''),
      updated_by = v_actor
  where id = v_intent.id;

  update public.finance_ledger_entries
  set status = 'failed', updated_by = v_actor
  where payment_intent_id = v_intent.id
    and entry_type = 'charge'
    and status = 'pending';

  insert into public.finance_pay_events (
    payment_intent_id, event_type, adapter_code, status_after, payload, created_by
  )
  values (
    v_intent.id, 'failed', v_intent.adapter_code, 'failed',
    jsonb_build_object('code', p_code, 'message', p_message),
    v_actor
  );

  perform public.write_audit_log(
    'kuteka_pay.failed',
    'finance_payment_intent',
    v_intent.id::text,
    jsonb_build_object('code', p_code, 'message', p_message)
  );

  return jsonb_build_object(
    'ok', true, 'status', 'failed', 'paymentIntentId', v_intent.id,
    'failureCode', p_code, 'failureMessage', p_message
  );
end;
$$;

revoke all on function public.kuteka_pay_fail(uuid, text, text) from public;
grant execute on function public.kuteka_pay_fail(uuid, text, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. RPC kuteka_pay_cancel — cancela intent pendente + ledger + pay_event
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.kuteka_pay_cancel(p_intent_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_intent public.finance_payment_intents%rowtype;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_intent
  from public.finance_payment_intents
  where id = p_intent_id;
  if not found then
    raise exception 'payment intent not found';
  end if;

  if v_intent.user_id is distinct from v_actor
     and not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'forbidden';
  end if;

  if v_intent.status = 'succeeded' then
    raise exception 'intent already captured';
  end if;
  if v_intent.status = 'cancelled' then
    return jsonb_build_object('ok', true, 'status', 'cancelled', 'paymentIntentId', v_intent.id);
  end if;

  update public.finance_payment_intents
  set status = 'cancelled', updated_by = v_actor
  where id = v_intent.id;

  update public.finance_ledger_entries
  set status = 'cancelled', updated_by = v_actor
  where payment_intent_id = v_intent.id
    and entry_type = 'charge'
    and status = 'pending';

  insert into public.finance_pay_events (
    payment_intent_id, event_type, adapter_code, status_after, payload, created_by
  )
  values (v_intent.id, 'cancelled', v_intent.adapter_code, 'cancelled', '{}'::jsonb, v_actor);

  perform public.write_audit_log(
    'kuteka_pay.cancelled',
    'finance_payment_intent',
    v_intent.id::text,
    '{}'::jsonb
  );

  return jsonb_build_object('ok', true, 'status', 'cancelled', 'paymentIntentId', v_intent.id);
end;
$$;

revoke all on function public.kuteka_pay_cancel(uuid) from public;
grant execute on function public.kuteka_pay_cancel(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. RPC kuteka_pay_status — estado legível pelo dono ou finance.read/manage
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.kuteka_pay_status(p_intent_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_intent public.finance_payment_intents%rowtype;
  v_events jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_intent
  from public.finance_payment_intents
  where id = p_intent_id;
  if not found then
    raise exception 'payment intent not found';
  end if;

  if v_intent.user_id is distinct from v_actor
     and not public.user_has_permission(v_actor, 'finance.read')
     and not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'forbidden';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id, 'eventType', e.event_type, 'statusAfter', e.status_after,
    'adapterCode', e.adapter_code, 'payload', e.payload, 'createdAt', e.created_at
  ) order by e.created_at asc), '[]'::jsonb)
  into v_events
  from public.finance_pay_events e
  where e.payment_intent_id = v_intent.id;

  return jsonb_build_object(
    'ok', true,
    'paymentIntentId', v_intent.id,
    'status', v_intent.status,
    'amount', v_intent.amount,
    'currency', v_intent.currency,
    'gateway', v_intent.gateway_code,
    'adapterCode', v_intent.adapter_code,
    'sandbox', v_intent.sandbox,
    'moduleCode', v_intent.module_code,
    'purpose', v_intent.purpose,
    'referenceType', v_intent.reference_type,
    'referenceId', v_intent.reference_id,
    'expiresAt', v_intent.expires_at,
    'capturedAt', v_intent.captured_at,
    'failedAt', v_intent.failed_at,
    'failureCode', v_intent.failure_code,
    'failureMessage', v_intent.failure_message,
    'events', v_events
  );
end;
$$;

revoke all on function public.kuteka_pay_status(uuid) from public;
grant execute on function public.kuteka_pay_status(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. RPC kuteka_pay_simulate_webhook — só sandbox, para testes do Super Admin
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.kuteka_pay_simulate_webhook(
  p_intent_id uuid,
  p_event text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_intent public.finance_payment_intents%rowtype;
  v_result jsonb;
begin
  if v_actor is null or not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'finance.manage required';
  end if;

  select * into v_intent
  from public.finance_payment_intents
  where id = p_intent_id;
  if not found then
    raise exception 'payment intent not found';
  end if;
  if not v_intent.sandbox then
    raise exception 'simulate_webhook is sandbox-only';
  end if;

  -- Regista o webhook simulado antes de despoletar a transição
  insert into public.finance_pay_events (
    payment_intent_id, event_type, adapter_code, status_after, payload, created_by
  )
  values (
    v_intent.id, 'webhook', v_intent.adapter_code, null,
    jsonb_build_object('simulated', true, 'event', p_event),
    v_actor
  );

  if p_event in ('succeeded', 'captured', 'payment.succeeded') then
    v_result := public.kuteka_pay_capture(v_intent.id);
  elsif p_event in ('failed', 'payment.failed') then
    v_result := public.kuteka_pay_fail(v_intent.id, 'sandbox_webhook', 'Falha simulada (sandbox).');
  elsif p_event in ('cancelled', 'payment.cancelled') then
    v_result := public.kuteka_pay_cancel(v_intent.id);
  elsif p_event = 'expired' then
    update public.finance_payment_intents
    set status = 'expired', updated_by = v_actor
    where id = v_intent.id and status not in ('succeeded');
    update public.finance_ledger_entries
    set status = 'cancelled', updated_by = v_actor
    where payment_intent_id = v_intent.id and entry_type = 'charge' and status = 'pending';
    insert into public.finance_pay_events (
      payment_intent_id, event_type, adapter_code, status_after, payload, created_by
    )
    values (v_intent.id, 'expired', v_intent.adapter_code, 'expired', '{}'::jsonb, v_actor);
    v_result := jsonb_build_object('ok', true, 'status', 'expired', 'paymentIntentId', v_intent.id);
  else
    raise exception 'unknown webhook event %', p_event;
  end if;

  return jsonb_build_object('ok', true, 'event', p_event, 'result', v_result);
end;
$$;

revoke all on function public.kuteka_pay_simulate_webhook(uuid, text) from public;
grant execute on function public.kuteka_pay_simulate_webhook(uuid, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. RPC kuteka_pay_adapter_health — saúde dos adaptadores (finance.read)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.kuteka_pay_adapter_health()
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
  if not (
    public.user_has_permission(v_actor, 'finance.read')
    or public.user_has_permission(v_actor, 'finance.manage')
  ) then
    raise exception 'finance.read required';
  end if;

  return jsonb_build_object(
    'ok', true,
    'custodyMode', 'none',
    'adapters', (
      select coalesce(jsonb_agg(row_to_json(a)), '[]'::jsonb)
      from (
        select
          g.code,
          g.name,
          g.active,
          g.sandbox,
          g.is_default,
          g.priority,
          g.module_allowlist,
          (select count(*) from public.finance_payment_intents pi where pi.adapter_code = g.code) as intents,
          (select count(*) from public.finance_payment_intents pi
             where pi.adapter_code = g.code and pi.status = 'succeeded') as succeeded,
          (select count(*) from public.finance_payment_intents pi
             where pi.adapter_code = g.code and pi.status = 'failed') as failed,
          (select count(*) from public.finance_payment_intents pi
             where pi.adapter_code = g.code and pi.status in ('created', 'awaiting_payment', 'processing')) as pending
        from public.finance_gateways g
        where g.deleted_at is null
        order by g.is_default desc, g.priority asc, g.code asc
      ) a
    )
  );
end;
$$;

revoke all on function public.kuteka_pay_adapter_health() from public;
grant execute on function public.kuteka_pay_adapter_health() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. RPC kuteka_pay_set_default_gateway — Super Admin escolhe adaptador base
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.kuteka_pay_set_default_gateway(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  if v_actor is null or not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'finance.manage required';
  end if;

  select id into v_id
  from public.finance_gateways
  where code = trim(p_code) and deleted_at is null;
  if not found then
    raise exception 'gateway % not found', p_code;
  end if;

  update public.finance_gateways set is_default = false where is_default;
  update public.finance_gateways
  set is_default = true, active = true, updated_by = v_actor
  where id = v_id;

  perform public.write_audit_log(
    'kuteka_pay.default_gateway_set',
    'finance_gateway',
    v_id::text,
    jsonb_build_object('code', p_code)
  );

  return jsonb_build_object('ok', true, 'gatewayCode', p_code);
end;
$$;

revoke all on function public.kuteka_pay_set_default_gateway(text) from public;
grant execute on function public.kuteka_pay_set_default_gateway(text) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 12. Wrappers — mantêm callers antigos a funcionar sobre o motor unificado
-- ═══════════════════════════════════════════════════════════════════════════

-- finance_create_sandbox_payment agora delega em kuteka_pay_create_intent.
-- Infere o module_code a partir do prefixo do produto (retrocompatível).
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
    p_gateway_code := coalesce(nullif(p_gateway_code, ''), 'sandbox'),
    p_idempotency_key := null,
    p_description := p_description,
    p_metadata := '{}'::jsonb
  );
end;
$$;

revoke all on function public.finance_create_sandbox_payment(text, text, text, text) from public;
grant execute on function public.finance_create_sandbox_payment(text, text, text, text) to authenticated;

-- finance_capture_sandbox_payment agora delega em kuteka_pay_capture.
create or replace function public.finance_capture_sandbox_payment(p_intent_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.kuteka_pay_capture(p_intent_id);
end;
$$;

revoke all on function public.finance_capture_sandbox_payment(uuid) from public;
grant execute on function public.finance_capture_sandbox_payment(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 13. Seeds — prioridades de gateway e sandbox como adaptador por omissão
-- ═══════════════════════════════════════════════════════════════════════════

update public.finance_gateways set priority = 10, is_default = false where code = 'sandbox';
update public.finance_gateways set priority = 20 where code = 'multicaixa';
update public.finance_gateways set priority = 30 where code = 'emis';
update public.finance_gateways set priority = 40 where code = 'bank_transfer';
update public.finance_gateways set priority = 50 where code = 'stripe';
update public.finance_gateways set priority = 60 where code = 'wise';

-- Garante exactamente um gateway por omissão (sandbox nesta fase)
update public.finance_gateways set is_default = false where is_default and code <> 'sandbox';
update public.finance_gateways set is_default = true, active = true where code = 'sandbox';

comment on table public.finance_pay_events is
  'ADR-018: Auditoria append-only do ciclo de vida de cada payment intent (Kuteka Pay).';
comment on column public.finance_payment_intents.module_code is
  'ADR-018: Módulo de negócio que originou o pagamento (smart_move, rent, marketplace, ...).';
comment on column public.finance_payment_intents.adapter_code is
  'ADR-018: Adaptador de gateway (sandbox|multicaixa|emis|stripe|wise|bank_transfer).';
comment on column public.finance_payment_intents.idempotency_key is
  'ADR-018: Chave de idempotência única — evita intents duplicados por retry.';
