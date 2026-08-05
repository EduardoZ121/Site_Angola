-- Fase C — Marketplace Operacional
-- Ref: Arquitectura Financeira v1.0 · ADR-015 · ADR-017 · ADR-018 · ADR-019
-- Fecha o ciclo completo do marketplace de prestadores usando a MESMA
-- infraestrutura financeira (Ledger + Kuteka Pay). Nenhum caminho de pagamento
-- isolado — o pagamento de um serviço passa pelo motor unificado Kuteka Pay.
--
-- Fluxo (N5):
-- Prestador → Orçamento → Aceitação → Execução → Pagamento (kuteka_pay) →
-- Avaliação → Comissão (ledger) → SLA → Histórico
--
-- Custódia continua desligada (custody_mode = none). Sandbox apenas nesta fase.
-- Aditivo (Core v1 freeze respeitado): apenas novas colunas/tabelas/RPCs.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. service_orders — colunas operacionais (orçamento, SLA, avaliação)
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.service_orders
  add column if not exists quoted_amount_aoa numeric(14, 2),
  add column if not exists quoted_at timestamptz,
  add column if not exists quote_notes text,
  add column if not exists accepted_at timestamptz,
  add column if not exists started_at timestamptz,
  add column if not exists sla_hours int not null default 48,
  add column if not exists sla_due_at timestamptz,
  add column if not exists sla_breached boolean not null default false,
  add column if not exists rating_score numeric(2, 1),
  add column if not exists rating_comment text,
  add column if not exists rated_at timestamptz;

-- Avaliação entre 1 e 5 (quando presente)
alter table public.service_orders
  drop constraint if exists service_orders_rating_score_check;
alter table public.service_orders
  add constraint service_orders_rating_score_check
  check (rating_score is null or (rating_score >= 1 and rating_score <= 5));

-- Expande a máquina de estados: acrescenta 'disputed'
alter table public.service_orders
  drop constraint if exists service_orders_status_check;
alter table public.service_orders
  add constraint service_orders_status_check
  check (status in (
    'requested', 'quoted', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed'
  ));

create index if not exists service_orders_provider_idx
  on public.service_orders (provider_id, created_at desc)
  where deleted_at is null;
create index if not exists service_orders_status_idx
  on public.service_orders (status)
  where deleted_at is null;
create index if not exists service_orders_sla_idx
  on public.service_orders (sla_due_at)
  where deleted_at is null and sla_breached = false;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. service_order_events — timeline append-only (transições, notas, actor)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.service_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.service_orders (id) on delete cascade,
  event_type text not null
    check (event_type in (
      'created', 'quoted', 'accepted', 'started', 'completed',
      'paid', 'rated', 'cancelled', 'disputed', 'sla_breached', 'note'
    )),
  from_status text,
  to_status text,
  actor_id uuid references auth.users (id),
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists service_order_events_order_idx
  on public.service_order_events (order_id, created_at desc);

alter table public.service_order_events enable row level security;

-- Leitura: cliente dono do pedido, prestador dono ou finance.manage/admin.panel.
drop policy if exists service_order_events_select on public.service_order_events;
create policy service_order_events_select
  on public.service_order_events for select to authenticated
  using (
    exists (
      select 1
      from public.service_orders o
      left join public.service_providers p on p.id = o.provider_id
      where o.id = order_id
        and (
          o.client_id = auth.uid()
          or p.user_id = auth.uid()
          or public.user_has_permission(auth.uid(), 'finance.manage')
          or public.user_has_permission(auth.uid(), 'admin.panel')
        )
    )
  );

-- Escrita apenas via RPCs security definer (append-only, sem update/delete).

-- Helper interno de escrita de eventos (não exposto a authenticated).
create or replace function public.marketplace_log_event(
  p_order_id uuid,
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
  insert into public.service_order_events (
    order_id, event_type, from_status, to_status, actor_id, note, metadata
  )
  values (
    p_order_id, p_event_type, p_from_status, p_to_status, auth.uid(), p_note,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.marketplace_log_event(uuid, text, text, text, text, jsonb) from public;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Kuteka Pay — override de montante genérico (limpo para todos os módulos)
--    Permite que módulos (marketplace, etc.) usem um valor negociado em vez do
--    preço de catálogo, mantendo o mesmo motor de pagamento e ledger.
-- ═══════════════════════════════════════════════════════════════════════════

drop function if exists public.kuteka_pay_create_intent(
  text, text, text, text, uuid, text, text, text, text, jsonb
);

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

  -- Override de montante negociado (marketplace, contratos à medida, ...)
  if v_override is not null then
    v_amount := v_override;
    v_quote := v_quote || jsonb_build_object('amount', v_amount, 'amountOverride', true);
  end if;

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

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. RPCs operacionais do marketplace (security definer)
-- ═══════════════════════════════════════════════════════════════════════════

-- 4.0 Contexto do utilizador: prestadores que pode operar + capacidade de gestão
create or replace function public.marketplace_my_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_can_manage boolean;
  v_providers jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  v_can_manage := public.user_has_permission(v_actor, 'finance.manage')
    or public.user_has_permission(v_actor, 'admin.panel');

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id,
    'businessName', p.business_name,
    'category', p.category,
    'isDemo', p.is_demo,
    'owned', p.user_id = v_actor
  ) order by p.business_name asc), '[]'::jsonb)
  into v_providers
  from public.service_providers p
  where p.deleted_at is null
    and (
      p.user_id = v_actor
      or (v_can_manage and p.is_demo)
    );

  return jsonb_build_object(
    'ok', true,
    'canManage', v_can_manage,
    'isProvider', jsonb_array_length(v_providers) > 0,
    'providers', v_providers
  );
end;
$$;

revoke all on function public.marketplace_my_context() from public;
grant execute on function public.marketplace_my_context() to authenticated;

-- 4.1 Listar prestadores (RLS já cobre; RPC devolve forma consistente {ok,data})
create or replace function public.marketplace_list_providers(p_category text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_cat text := nullif(trim(p_category), '');
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  return jsonb_build_object(
    'ok', true,
    'data', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'businessName', p.business_name,
        'category', p.category,
        'description', p.description,
        'phone', p.phone,
        'province', p.province,
        'municipality', p.municipality,
        'rating', p.rating,
        'isDemo', p.is_demo
      ) order by p.rating desc nulls last, p.business_name asc)
      from public.service_providers p
      where p.deleted_at is null
        and p.active = true
        and (v_cat is null or v_cat = 'all' or p.category = v_cat)
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.marketplace_list_providers(text) from public;
grant execute on function public.marketplace_list_providers(text) to authenticated;

-- 4.2 Criar pedido (cliente) — define SLA, escreve evento. Sem comissão ainda:
--     a comissão nasce no pagamento (ledger via Kuteka Pay).
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

-- 4.3 Submeter orçamento (prestador dono, finance.manage ou admin em demo)
create or replace function public.marketplace_submit_quote(
  p_order_id uuid,
  p_amount numeric,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_order public.service_orders%rowtype;
  v_provider public.service_providers%rowtype;
  v_rate numeric(8, 4);
  v_amount numeric(14, 2);
  v_commission numeric(14, 2);
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount required';
  end if;
  v_amount := round(p_amount, 2);

  select * into v_order from public.service_orders where id = p_order_id and deleted_at is null;
  if not found then
    raise exception 'order not found';
  end if;
  select * into v_provider from public.service_providers where id = v_order.provider_id;

  if not (
    v_provider.user_id = v_actor
    or public.user_has_permission(v_actor, 'finance.manage')
    or (v_provider.is_demo and public.user_has_permission(v_actor, 'admin.panel'))
  ) then
    raise exception 'provider role required';
  end if;

  if v_order.status not in ('requested', 'quoted') then
    raise exception 'order not in a quotable state (%).', v_order.status;
  end if;

  select coalesce(take_rate_pct, 10) into v_rate
  from public.finance_commission_rules
  where code = coalesce(v_provider.take_rate_code, 'cleaning_default')
    and deleted_at is null
  limit 1;
  v_commission := round(v_amount * coalesce(v_rate, 10) / 100.0, 2);

  update public.service_orders
  set status = 'quoted',
      quoted_amount_aoa = v_amount,
      amount_aoa = v_amount,
      commission_aoa = v_commission,
      quote_notes = nullif(trim(p_notes), ''),
      quoted_at = timezone('utc', now()),
      updated_by = v_actor
  where id = p_order_id;

  perform public.marketplace_log_event(
    p_order_id, 'quoted', v_order.status, 'quoted',
    nullif(trim(p_notes), ''),
    jsonb_build_object('amount', v_amount, 'commission', v_commission, 'takeRate', v_rate)
  );

  perform public.write_audit_log(
    'marketplace.quote_submitted',
    'service_order',
    p_order_id::text,
    jsonb_build_object('amount', v_amount, 'commission', v_commission)
  );

  return jsonb_build_object(
    'ok', true, 'orderId', p_order_id, 'status', 'quoted',
    'amount', v_amount, 'commission', v_commission
  );
end;
$$;

revoke all on function public.marketplace_submit_quote(uuid, numeric, text) from public;
grant execute on function public.marketplace_submit_quote(uuid, numeric, text) to authenticated;

-- 4.4 Aceitar orçamento (cliente dono)
create or replace function public.marketplace_accept_quote(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_order public.service_orders%rowtype;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_order from public.service_orders where id = p_order_id and deleted_at is null;
  if not found then
    raise exception 'order not found';
  end if;
  if v_order.client_id <> v_actor and not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'only the client can accept the quote';
  end if;
  if v_order.status <> 'quoted' then
    raise exception 'order has no pending quote (%).', v_order.status;
  end if;

  update public.service_orders
  set status = 'accepted', accepted_at = timezone('utc', now()), updated_by = v_actor
  where id = p_order_id;

  perform public.marketplace_log_event(
    p_order_id, 'accepted', 'quoted', 'accepted', 'Orçamento aceite pelo cliente.', '{}'::jsonb
  );
  perform public.write_audit_log(
    'marketplace.quote_accepted', 'service_order', p_order_id::text, '{}'::jsonb
  );

  return jsonb_build_object('ok', true, 'orderId', p_order_id, 'status', 'accepted');
end;
$$;

revoke all on function public.marketplace_accept_quote(uuid) from public;
grant execute on function public.marketplace_accept_quote(uuid) to authenticated;

-- 4.5 Iniciar execução (prestador)
create or replace function public.marketplace_start_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_order public.service_orders%rowtype;
  v_provider public.service_providers%rowtype;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_order from public.service_orders where id = p_order_id and deleted_at is null;
  if not found then
    raise exception 'order not found';
  end if;
  select * into v_provider from public.service_providers where id = v_order.provider_id;

  if not (
    v_provider.user_id = v_actor
    or public.user_has_permission(v_actor, 'finance.manage')
    or (v_provider.is_demo and public.user_has_permission(v_actor, 'admin.panel'))
  ) then
    raise exception 'provider role required';
  end if;
  if v_order.status <> 'accepted' then
    raise exception 'order not ready to start (%).', v_order.status;
  end if;

  update public.service_orders
  set status = 'in_progress', started_at = timezone('utc', now()), updated_by = v_actor
  where id = p_order_id;

  perform public.marketplace_log_event(
    p_order_id, 'started', 'accepted', 'in_progress', 'Execução iniciada pelo prestador.', '{}'::jsonb
  );
  perform public.write_audit_log(
    'marketplace.order_started', 'service_order', p_order_id::text, '{}'::jsonb
  );

  return jsonb_build_object('ok', true, 'orderId', p_order_id, 'status', 'in_progress');
end;
$$;

revoke all on function public.marketplace_start_order(uuid) from public;
grant execute on function public.marketplace_start_order(uuid) to authenticated;

-- 4.6 Concluir execução (prestador) — avalia SLA
create or replace function public.marketplace_complete_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_order public.service_orders%rowtype;
  v_provider public.service_providers%rowtype;
  v_breached boolean;
  v_now timestamptz := timezone('utc', now());
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_order from public.service_orders where id = p_order_id and deleted_at is null;
  if not found then
    raise exception 'order not found';
  end if;
  select * into v_provider from public.service_providers where id = v_order.provider_id;

  if not (
    v_provider.user_id = v_actor
    or public.user_has_permission(v_actor, 'finance.manage')
    or (v_provider.is_demo and public.user_has_permission(v_actor, 'admin.panel'))
  ) then
    raise exception 'provider role required';
  end if;
  if v_order.status <> 'in_progress' then
    raise exception 'order not in progress (%).', v_order.status;
  end if;

  v_breached := v_order.sla_due_at is not null and v_now > v_order.sla_due_at;

  update public.service_orders
  set status = 'completed',
      completed_at = v_now,
      sla_breached = v_breached,
      updated_by = v_actor
  where id = p_order_id;

  perform public.marketplace_log_event(
    p_order_id, 'completed', 'in_progress', 'completed',
    'Serviço concluído pelo prestador.',
    jsonb_build_object('slaBreached', v_breached)
  );
  perform public.write_audit_log(
    'marketplace.order_completed', 'service_order', p_order_id::text,
    jsonb_build_object('slaBreached', v_breached)
  );

  return jsonb_build_object(
    'ok', true, 'orderId', p_order_id, 'status', 'completed', 'slaBreached', v_breached
  );
end;
$$;

revoke all on function public.marketplace_complete_order(uuid) from public;
grant execute on function public.marketplace_complete_order(uuid) to authenticated;

-- 4.7 Pagar serviço (cliente) — via Kuteka Pay + comissão no Ledger
create or replace function public.marketplace_pay_order(
  p_order_id uuid,
  p_gateway_code text default 'sandbox'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_order public.service_orders%rowtype;
  v_provider public.service_providers%rowtype;
  v_amount numeric(14, 2);
  v_rate numeric(8, 4);
  v_commission numeric(14, 2);
  v_pay jsonb;
  v_intent_id uuid;
  v_client_action text;
  v_captured boolean := false;
  v_ledger_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_order from public.service_orders where id = p_order_id and deleted_at is null;
  if not found then
    raise exception 'order not found';
  end if;
  if v_order.client_id <> v_actor and not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'only the client can pay';
  end if;
  if v_order.status <> 'completed' then
    raise exception 'order must be completed before payment (%).', v_order.status;
  end if;
  if v_order.payment_intent_id is not null then
    raise exception 'order already paid';
  end if;

  v_amount := coalesce(v_order.quoted_amount_aoa, v_order.amount_aoa);
  if v_amount is null or v_amount <= 0 then
    raise exception 'order has no amount to charge';
  end if;

  select * into v_provider from public.service_providers where id = v_order.provider_id;

  -- Pagamento via motor unificado Kuteka Pay (module_code = marketplace),
  -- usando o valor negociado como override do preço de catálogo.
  v_pay := public.kuteka_pay_create_intent(
    p_product_code := 'marketplace.service',
    p_module_code := 'marketplace',
    p_purpose := 'service_order_payment',
    p_reference_type := 'service_order',
    p_reference_id := p_order_id,
    p_urgency_band := null,
    p_gateway_code := coalesce(nullif(trim(p_gateway_code), ''), 'sandbox'),
    p_idempotency_key := 'svc-' || p_order_id::text,
    p_description := 'Serviço marketplace — ' || coalesce(v_provider.business_name, v_order.title),
    p_metadata := jsonb_build_object('orderId', p_order_id, 'providerId', v_order.provider_id),
    p_amount_override := v_amount
  );

  v_intent_id := (v_pay->>'paymentIntentId')::uuid;
  v_client_action := v_pay->'clientAction'->>'type';

  -- Sandbox: captura automática (fecha o ciclo para demo).
  if v_client_action = 'auto_capture_ready' then
    perform public.kuteka_pay_capture(v_intent_id);
    v_captured := true;
  elsif v_client_action = 'already_captured' then
    v_captured := true;
  end if;

  -- Comissão B2B da plataforma (provider → platform), estado segue o pagamento.
  select coalesce(take_rate_pct, 10) into v_rate
  from public.finance_commission_rules
  where code = coalesce(v_provider.take_rate_code, 'cleaning_default')
    and deleted_at is null
  limit 1;
  v_commission := round(v_amount * coalesce(v_rate, 10) / 100.0, 2);

  insert into public.finance_ledger_entries (
    entry_type, status, currency, amount, country_code,
    payer_type, payer_id, payee_type, payee_id,
    payment_intent_id, custody_mode, description, metadata, created_by, updated_by
  )
  values (
    'commission', case when v_captured then 'captured' else 'pending' end,
    'AOA', v_commission, 'AO',
    'provider', null, 'platform', null,
    v_intent_id, 'none',
    'Comissão marketplace — ' || coalesce(v_provider.business_name, v_order.title),
    jsonb_build_object(
      'orderId', p_order_id, 'takeRate', v_rate, 'providerId', v_order.provider_id
    ),
    v_actor, v_actor
  )
  returning id into v_ledger_id;

  update public.service_orders
  set payment_intent_id = v_intent_id,
      amount_aoa = v_amount,
      commission_aoa = v_commission,
      updated_by = v_actor
  where id = p_order_id;

  perform public.marketplace_log_event(
    p_order_id, 'paid', v_order.status, v_order.status,
    'Pagamento processado via Kuteka Pay.',
    jsonb_build_object(
      'paymentIntentId', v_intent_id, 'amount', v_amount, 'commission', v_commission,
      'captured', v_captured, 'gateway', v_pay->>'gateway'
    )
  );

  perform public.write_audit_log(
    'marketplace.order_paid', 'service_order', p_order_id::text,
    jsonb_build_object('paymentIntentId', v_intent_id, 'amount', v_amount, 'commission', v_commission)
  );

  return jsonb_build_object(
    'ok', true,
    'orderId', p_order_id,
    'paymentIntentId', v_intent_id,
    'amount', v_amount,
    'commission', v_commission,
    'commissionLedgerId', v_ledger_id,
    'captured', v_captured,
    'gateway', v_pay->>'gateway',
    'payment', v_pay
  );
end;
$$;

revoke all on function public.marketplace_pay_order(uuid, text) from public;
grant execute on function public.marketplace_pay_order(uuid, text) to authenticated;

-- 4.8 Cancelar pedido (cliente, prestador ou finance.manage)
create or replace function public.marketplace_cancel_order(
  p_order_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_order public.service_orders%rowtype;
  v_provider public.service_providers%rowtype;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_order from public.service_orders where id = p_order_id and deleted_at is null;
  if not found then
    raise exception 'order not found';
  end if;
  select * into v_provider from public.service_providers where id = v_order.provider_id;

  if not (
    v_order.client_id = v_actor
    or v_provider.user_id = v_actor
    or public.user_has_permission(v_actor, 'finance.manage')
    or (v_provider.is_demo and public.user_has_permission(v_actor, 'admin.panel'))
  ) then
    raise exception 'forbidden';
  end if;
  if v_order.status in ('completed', 'cancelled') then
    raise exception 'order cannot be cancelled (%).', v_order.status;
  end if;

  update public.service_orders
  set status = 'cancelled', updated_by = v_actor
  where id = p_order_id;

  perform public.marketplace_log_event(
    p_order_id, 'cancelled', v_order.status, 'cancelled',
    nullif(trim(p_reason), ''), '{}'::jsonb
  );
  perform public.write_audit_log(
    'marketplace.order_cancelled', 'service_order', p_order_id::text,
    jsonb_build_object('reason', p_reason)
  );

  return jsonb_build_object('ok', true, 'orderId', p_order_id, 'status', 'cancelled');
end;
$$;

revoke all on function public.marketplace_cancel_order(uuid, text) from public;
grant execute on function public.marketplace_cancel_order(uuid, text) to authenticated;

-- 4.9 Avaliar serviço (cliente após conclusão) — actualiza média do prestador
create or replace function public.marketplace_rate_order(
  p_order_id uuid,
  p_score numeric,
  p_comment text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_order public.service_orders%rowtype;
  v_score numeric(2, 1);
  v_avg numeric(3, 2);
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if p_score is null or p_score < 1 or p_score > 5 then
    raise exception 'score must be between 1 and 5';
  end if;
  v_score := round(p_score, 1);

  select * into v_order from public.service_orders where id = p_order_id and deleted_at is null;
  if not found then
    raise exception 'order not found';
  end if;
  if v_order.client_id <> v_actor and not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'only the client can rate';
  end if;
  if v_order.status <> 'completed' then
    raise exception 'order must be completed before rating (%).', v_order.status;
  end if;
  if v_order.rated_at is not null then
    raise exception 'order already rated';
  end if;

  update public.service_orders
  set rating_score = v_score,
      rating_comment = nullif(trim(p_comment), ''),
      rated_at = timezone('utc', now()),
      updated_by = v_actor
  where id = p_order_id;

  select round(avg(rating_score)::numeric, 2) into v_avg
  from public.service_orders
  where provider_id = v_order.provider_id
    and rating_score is not null
    and deleted_at is null;

  update public.service_providers
  set rating = coalesce(v_avg, rating), updated_by = v_actor
  where id = v_order.provider_id;

  perform public.marketplace_log_event(
    p_order_id, 'rated', 'completed', 'completed',
    nullif(trim(p_comment), ''),
    jsonb_build_object('score', v_score, 'providerAverage', v_avg)
  );
  perform public.write_audit_log(
    'marketplace.order_rated', 'service_order', p_order_id::text,
    jsonb_build_object('score', v_score)
  );

  return jsonb_build_object(
    'ok', true, 'orderId', p_order_id, 'score', v_score, 'providerAverage', v_avg
  );
end;
$$;

revoke all on function public.marketplace_rate_order(uuid, numeric, text) from public;
grant execute on function public.marketplace_rate_order(uuid, numeric, text) to authenticated;

-- 4.10 Verificar SLAs (finance.manage / admin, cron futuro)
create or replace function public.marketplace_check_slas()
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
    from public.service_orders
    where deleted_at is null
      and sla_breached = false
      and sla_due_at is not null
      and sla_due_at < timezone('utc', now())
      and status not in ('completed', 'cancelled')
  loop
    update public.service_orders set sla_breached = true, updated_by = v_actor where id = r.id;
    perform public.marketplace_log_event(
      r.id, 'sla_breached', r.status, r.status, 'SLA ultrapassado.', '{}'::jsonb
    );
    v_count := v_count + 1;
  end loop;

  perform public.write_audit_log(
    'marketplace.sla_check', 'service_order', null,
    jsonb_build_object('breached', v_count)
  );

  return jsonb_build_object('ok', true, 'breached', v_count);
end;
$$;

revoke all on function public.marketplace_check_slas() from public;
grant execute on function public.marketplace_check_slas() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. Compatibilidade — create_service_order passa a delegar em marketplace_*
--    (mantém o nome antigo; a comissão deixa de nascer aqui — nasce no pagamento)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.create_service_order(
  p_provider_id uuid,
  p_title text,
  p_category text,
  p_description text default null,
  p_property_id uuid default null,
  p_amount_aoa numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  v_result := public.marketplace_create_order(
    p_provider_id := p_provider_id,
    p_title := p_title,
    p_category := p_category,
    p_description := p_description,
    p_property_id := p_property_id,
    p_sla_hours := 48
  );

  -- Se um valor foi indicado à cabeça, regista-o como orçamento imediato.
  if p_amount_aoa is not null and p_amount_aoa > 0 and coalesce((v_result->>'ok')::boolean, false) then
    perform public.marketplace_submit_quote(
      (v_result->>'orderId')::uuid, p_amount_aoa, 'Valor indicado no pedido.'
    );
  end if;

  return v_result;
end;
$$;

revoke all on function public.create_service_order(uuid, text, text, text, uuid, numeric) from public;
grant execute on function public.create_service_order(uuid, text, text, text, uuid, numeric) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Seeds — produto marketplace.service + preço placeholder e prestadores demo
-- ═══════════════════════════════════════════════════════════════════════════

-- 6.1 Produto genérico do marketplace (preço base; valor real via override)
do $$
declare
  v_id uuid;
begin
  insert into public.finance_products (
    code, name, description, category, pricing_model, buyer_roles,
    country_code, currency, kai_suggestible, active
  ) values (
    'marketplace.service', 'Serviço de prestador',
    'Serviço do marketplace de prestadores. O valor é o orçamento aceite (override).',
    'marketplace', 'fixed', array['client'], 'AO', 'AOA', true, true
  )
  on conflict (code) do update
  set name = excluded.name,
      description = excluded.description,
      category = excluded.category,
      pricing_model = excluded.pricing_model,
      active = true,
      deleted_at = null;

  select id into v_id from public.finance_products where code = 'marketplace.service';
  insert into public.finance_price_rules (product_id, code, label, amount, currency, charge_event, priority)
  values (v_id, 'marketplace_default', 'Serviço marketplace (base)', 25000, 'AOA', 'on_completion', 10)
  on conflict (product_id, code) do update set amount = excluded.amount, active = true, deleted_at = null;
end $$;

-- 6.2 Atribui 1-2 prestadores demo ao parceiro demo, para testar o lado prestador
--     (quote/start/complete). finance.manage/admin também podem operar demos.
do $$
declare
  v_partner uuid;
begin
  select id into v_partner from auth.users where email = 'demo.parceiro@kuteka.local' limit 1;
  if v_partner is not null then
    update public.service_providers
    set user_id = v_partner
    where is_demo = true
      and user_id is null
      and business_name in ('Limpeza Express Luanda', 'Mudanças Angola Pro');
  end if;
end $$;

comment on table public.service_order_events is
  'ADR-019: Timeline append-only do ciclo de vida de cada pedido de serviço (marketplace operacional).';
comment on column public.service_orders.sla_due_at is
  'ADR-019: Prazo-limite de SLA (sla_hours a partir da criação). marketplace_check_slas marca breaches.';
comment on column public.service_orders.quoted_amount_aoa is
  'ADR-019: Valor do orçamento do prestador; usado como override de montante no Kuteka Pay.';
