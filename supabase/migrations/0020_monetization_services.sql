-- PRD-010 Fase 3 monetização: Mudança Inteligente, Prestadores, Planos Parceiro, lembretes
-- Ref: docs/finance/ARQUITETURA_FINANCEIRA_KUTEKA.md · ADR-015

-- ─── Feature flags (Service Health) ─────────────────────────────────────────

create table if not exists public.platform_feature_flags (
  code text primary key,
  label text not null,
  description text,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users (id)
);

alter table public.platform_feature_flags enable row level security;

drop policy if exists platform_feature_flags_select on public.platform_feature_flags;
create policy platform_feature_flags_select
  on public.platform_feature_flags for select to authenticated
  using (true);

drop policy if exists platform_feature_flags_write on public.platform_feature_flags;
create policy platform_feature_flags_write
  on public.platform_feature_flags for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

insert into public.platform_feature_flags (code, label, description, enabled) values
  ('smart_move', 'Mudança Inteligente', 'Procura assistida por urgência', true),
  ('kuteka_plus', 'Kuteka Plus', 'Subscrição opcional', true),
  ('marketplace', 'Marketplace de prestadores', 'Rede de serviços', true),
  ('partner_plans', 'Planos Parceiro', 'Bronze / Silver / Gold', true),
  ('rent_reminders', 'Lembretes de renda', 'Notificações D-5…atraso', true),
  ('kai_commercial', 'KAI comercial', 'Sugestões de upsell', true)
on conflict (code) do nothing;

-- ─── Smart Move requests ────────────────────────────────────────────────────

create table if not exists public.smart_move_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  contract_id uuid references public.property_contracts (id) on delete set null,
  property_id uuid references public.properties (id) on delete set null,
  urgency_band text not null
    check (urgency_band in ('planned_90', 'priority_60', 'urgent_30', 'emergency_14')),
  target_exit_on date not null,
  status text not null default 'draft'
    check (status in (
      'draft', 'awaiting_payment', 'active', 'matched', 'completed', 'cancelled', 'failed'
    )),
  preferences jsonb not null default '{}'::jsonb,
  opening_payment_intent_id uuid references public.finance_payment_intents (id),
  success_payment_intent_id uuid references public.finance_payment_intents (id),
  matched_property_id uuid references public.properties (id),
  kai_notes text,
  partner_notified_at timestamptz,
  agent_task_created_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

create index if not exists smart_move_requests_client_idx
  on public.smart_move_requests (client_id, created_at desc)
  where deleted_at is null;
create index if not exists smart_move_requests_status_idx
  on public.smart_move_requests (status)
  where deleted_at is null;

drop trigger if exists smart_move_requests_set_updated_at on public.smart_move_requests;
create trigger smart_move_requests_set_updated_at
before update on public.smart_move_requests
for each row execute function public.set_updated_at();

alter table public.smart_move_requests enable row level security;

drop policy if exists smart_move_select on public.smart_move_requests;
create policy smart_move_select
  on public.smart_move_requests for select to authenticated
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

drop policy if exists smart_move_insert on public.smart_move_requests;
create policy smart_move_insert
  on public.smart_move_requests for insert to authenticated
  with check (client_id = auth.uid());

drop policy if exists smart_move_update on public.smart_move_requests;
create policy smart_move_update
  on public.smart_move_requests for update to authenticated
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

-- ─── Service providers + orders (marketplace) ───────────────────────────────

create table if not exists public.service_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  business_name text not null,
  category text not null
    check (category in (
      'cleaning', 'moving', 'painting', 'plumbing', 'electricity',
      'gardening', 'security', 'renovation', 'internet', 'insurance', 'other'
    )),
  description text,
  phone text,
  province text,
  municipality text,
  take_rate_code text references public.finance_commission_rules (code),
  rating numeric(3, 2) default 0,
  active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  deleted_at timestamptz
);

create index if not exists service_providers_category_idx
  on public.service_providers (category)
  where deleted_at is null and active;

drop trigger if exists service_providers_set_updated_at on public.service_providers;
create trigger service_providers_set_updated_at
before update on public.service_providers
for each row execute function public.set_updated_at();

alter table public.service_providers enable row level security;

drop policy if exists service_providers_select on public.service_providers;
create policy service_providers_select
  on public.service_providers for select to authenticated
  using (deleted_at is null and (active = true or public.user_has_permission(auth.uid(), 'finance.manage')));

drop policy if exists service_providers_write on public.service_providers;
create policy service_providers_write
  on public.service_providers for all to authenticated
  using (
    user_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'finance.manage')
    or public.user_has_permission(auth.uid(), 'admin.panel')
  )
  with check (
    user_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'finance.manage')
    or public.user_has_permission(auth.uid(), 'admin.panel')
  );

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  provider_id uuid not null references public.service_providers (id),
  property_id uuid references public.properties (id),
  maintenance_request_id uuid references public.maintenance_requests (id),
  category text not null,
  title text not null,
  description text,
  status text not null default 'requested'
    check (status in (
      'requested', 'quoted', 'accepted', 'in_progress', 'completed', 'cancelled'
    )),
  amount_aoa numeric(14, 2),
  currency text not null default 'AOA',
  commission_aoa numeric(14, 2),
  payment_intent_id uuid references public.finance_payment_intents (id),
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  deleted_at timestamptz
);

create index if not exists service_orders_client_idx
  on public.service_orders (client_id, created_at desc)
  where deleted_at is null;

drop trigger if exists service_orders_set_updated_at on public.service_orders;
create trigger service_orders_set_updated_at
before update on public.service_orders
for each row execute function public.set_updated_at();

alter table public.service_orders enable row level security;

drop policy if exists service_orders_select on public.service_orders;
create policy service_orders_select
  on public.service_orders for select to authenticated
  using (
    deleted_at is null
    and (
      client_id = auth.uid()
      or exists (
        select 1 from public.service_providers p
        where p.id = provider_id and p.user_id = auth.uid()
      )
      or public.user_has_permission(auth.uid(), 'admin.panel')
      or public.user_has_permission(auth.uid(), 'finance.manage')
    )
  );

drop policy if exists service_orders_insert on public.service_orders;
create policy service_orders_insert
  on public.service_orders for insert to authenticated
  with check (client_id = auth.uid());

drop policy if exists service_orders_update on public.service_orders;
create policy service_orders_update
  on public.service_orders for update to authenticated
  using (
    client_id = auth.uid()
    or exists (
      select 1 from public.service_providers p
      where p.id = provider_id and p.user_id = auth.uid()
    )
    or public.user_has_permission(auth.uid(), 'finance.manage')
  )
  with check (true);

-- ─── Partner plan subscriptions ─────────────────────────────────────────────

create table if not exists public.partner_plan_subscriptions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references auth.users (id) on delete cascade,
  product_code text not null references public.finance_products (code),
  status text not null default 'active'
    check (status in ('trialing', 'active', 'past_due', 'cancelled')),
  started_at timestamptz not null default timezone('utc', now()),
  renews_at timestamptz,
  payment_intent_id uuid references public.finance_payment_intents (id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (partner_id, product_code)
);

drop trigger if exists partner_plan_subscriptions_set_updated_at on public.partner_plan_subscriptions;
create trigger partner_plan_subscriptions_set_updated_at
before update on public.partner_plan_subscriptions
for each row execute function public.set_updated_at();

alter table public.partner_plan_subscriptions enable row level security;

drop policy if exists partner_plans_select on public.partner_plan_subscriptions;
create policy partner_plans_select
  on public.partner_plan_subscriptions for select to authenticated
  using (
    partner_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'finance.read')
    or public.user_has_permission(auth.uid(), 'finance.manage')
  );

drop policy if exists partner_plans_write on public.partner_plan_subscriptions;
create policy partner_plans_insert
  on public.partner_plan_subscriptions for insert to authenticated
  with check (
    partner_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'finance.manage')
  );

create policy partner_plans_update
  on public.partner_plan_subscriptions for update to authenticated
  using (
    partner_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'finance.manage')
  )
  with check (true);

-- ─── Rent payment reminders ─────────────────────────────────────────────────

create table if not exists public.payment_reminders (
  id uuid primary key default gen_random_uuid(),
  contract_payment_id uuid not null references public.contract_payments (id) on delete cascade,
  channel text not null default 'in_app'
    check (channel in ('in_app', 'email', 'whatsapp', 'sms')),
  offset_label text not null
    check (offset_label in ('d5', 'd3', 'd1', 'd0', 'late')),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'sent', 'failed', 'cancelled')),
  scheduled_for date not null,
  sent_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists payment_reminders_sched_idx
  on public.payment_reminders (scheduled_for, status);

create unique index if not exists payment_reminders_unique_idx
  on public.payment_reminders (contract_payment_id, offset_label, channel);

alter table public.payment_reminders enable row level security;

drop policy if exists payment_reminders_select on public.payment_reminders;
create policy payment_reminders_select
  on public.payment_reminders for select to authenticated
  using (
    public.user_has_permission(auth.uid(), 'finance.read')
    or public.user_has_permission(auth.uid(), 'finance.manage')
    or public.user_has_permission(auth.uid(), 'admin.panel')
    or exists (
      select 1
      from public.contract_payments cp
      join public.property_contracts c on c.id = cp.contract_id
      where cp.id = contract_payment_id
        and (c.client_id = auth.uid() or c.partner_id = auth.uid())
    )
  );

drop policy if exists payment_reminders_manage on public.payment_reminders;
create policy payment_reminders_manage
  on public.payment_reminders for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

-- ─── RPCs ───────────────────────────────────────────────────────────────────

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

  -- Opening fee payment (sandbox)
  v_pay := public.finance_create_sandbox_payment(
    'smart_move.open',
    p_urgency_band,
    'sandbox',
    'Mudança Inteligente — taxa de abertura'
  );

  insert into public.smart_move_requests (
    client_id, contract_id, property_id, urgency_band, target_exit_on,
    status, preferences, opening_payment_intent_id,
    kai_notes, partner_notified_at, agent_task_created_at,
    created_by, updated_by
  )
  values (
    v_actor,
    p_contract_id,
    v_contract.property_id,
    p_urgency_band,
    p_target_exit_on,
    'awaiting_payment',
    coalesce(p_preferences, '{}'::jsonb),
    (v_pay->>'paymentIntentId')::uuid,
    'KAI: procura iniciada conforme urgência ' || p_urgency_band ||
      '. Parceiro e agentes serão notificados após pagamento.',
    null,
    null,
    v_actor,
    v_actor
  )
  returning id into v_request_id;

  -- Auto-capture sandbox opening fee for demo fluidity
  perform public.finance_capture_sandbox_payment((v_pay->>'paymentIntentId')::uuid);

  update public.smart_move_requests
  set status = 'active',
      partner_notified_at = timezone('utc', now()),
      agent_task_created_at = timezone('utc', now()),
      kai_notes = kai_notes || ' Pagamento abertura capturado (sandbox). Pipeline activo.'
  where id = v_request_id;

  perform public.write_audit_log(
    'smart_move.created',
    'smart_move_request',
    v_request_id::text,
    jsonb_build_object('urgency', p_urgency_band, 'payment', v_pay)
  );

  return jsonb_build_object(
    'ok', true,
    'requestId', v_request_id,
    'status', 'active',
    'payment', v_pay
  );
end;
$$;

revoke all on function public.create_smart_move_request(text, date, uuid, jsonb) from public;
grant execute on function public.create_smart_move_request(text, date, uuid, jsonb) to authenticated;

create or replace function public.activate_partner_plan(p_product_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_pay jsonb;
  v_id uuid;
  v_enabled boolean;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select enabled into v_enabled from public.platform_feature_flags where code = 'partner_plans';
  if coalesce(v_enabled, true) is false then
    raise exception 'partner_plans disabled';
  end if;

  if p_product_code not in (
    'partner.bronze.monthly', 'partner.silver.monthly', 'partner.gold.monthly'
  ) then
    raise exception 'invalid partner plan';
  end if;

  if not public.user_has_permission(v_actor, 'properties.manage')
     and not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'partner role required';
  end if;

  v_pay := public.finance_create_sandbox_payment(
    p_product_code, null, 'sandbox', 'Plano Parceiro Kuteka'
  );
  perform public.finance_capture_sandbox_payment((v_pay->>'paymentIntentId')::uuid);

  insert into public.partner_plan_subscriptions (
    partner_id, product_code, status, started_at, renews_at, payment_intent_id
  )
  values (
    v_actor,
    p_product_code,
    'active',
    timezone('utc', now()),
    timezone('utc', now()) + interval '30 days',
    (v_pay->>'paymentIntentId')::uuid
  )
  on conflict (partner_id, product_code) do update
  set status = 'active',
      started_at = timezone('utc', now()),
      renews_at = timezone('utc', now()) + interval '30 days',
      payment_intent_id = excluded.payment_intent_id,
      updated_at = timezone('utc', now())
  returning id into v_id;

  perform public.write_audit_log(
    'partner_plan.activated',
    'partner_plan_subscription',
    v_id::text,
    jsonb_build_object('product', p_product_code)
  );

  return jsonb_build_object('ok', true, 'subscriptionId', v_id, 'payment', v_pay);
end;
$$;

revoke all on function public.activate_partner_plan(text) from public;
grant execute on function public.activate_partner_plan(text) to authenticated;

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
  v_actor uuid := auth.uid();
  v_provider public.service_providers%rowtype;
  v_rate numeric(8, 4);
  v_amount numeric(14, 2);
  v_commission numeric(14, 2);
  v_order_id uuid;
  v_ledger_id uuid;
  v_enabled boolean;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select enabled into v_enabled from public.platform_feature_flags where code = 'marketplace';
  if coalesce(v_enabled, true) is false then
    raise exception 'marketplace disabled';
  end if;

  select * into v_provider
  from public.service_providers
  where id = p_provider_id and deleted_at is null and active = true;
  if not found then
    raise exception 'provider not found';
  end if;

  v_amount := coalesce(p_amount_aoa, 25000);
  select coalesce(take_rate_pct, 10) into v_rate
  from public.finance_commission_rules
  where code = coalesce(v_provider.take_rate_code, 'cleaning_default')
    and deleted_at is null
  limit 1;
  v_commission := round(v_amount * coalesce(v_rate, 10) / 100.0, 2);

  insert into public.service_orders (
    client_id, provider_id, property_id, category, title, description,
    status, amount_aoa, commission_aoa, created_by
  )
  values (
    v_actor, p_provider_id, p_property_id, coalesce(nullif(p_category, ''), v_provider.category),
    trim(p_title), p_description, 'requested', v_amount, v_commission, v_actor
  )
  returning id into v_order_id;

  -- Commission ledger (B2B — provider side conceptually)
  insert into public.finance_ledger_entries (
    entry_type, status, currency, amount, country_code,
    payer_type, payee_type, custody_mode, description, metadata, created_by, updated_by
  )
  values (
    'commission', 'pending', 'AOA', v_commission, 'AO',
    'provider', 'platform', 'none',
    'Comissão marketplace — ' || v_provider.business_name,
    jsonb_build_object('order_id', v_order_id, 'take_rate', v_rate),
    v_actor, v_actor
  )
  returning id into v_ledger_id;

  return jsonb_build_object(
    'ok', true,
    'orderId', v_order_id,
    'amount', v_amount,
    'commission', v_commission,
    'ledgerEntryId', v_ledger_id
  );
end;
$$;

revoke all on function public.create_service_order(uuid, text, text, text, uuid, numeric) from public;
grant execute on function public.create_service_order(uuid, text, text, text, uuid, numeric) to authenticated;

create or replace function public.schedule_rent_reminders(p_contract_payment_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_due date;
  v_count int := 0;
  r record;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if not (
    public.user_has_permission(v_actor, 'finance.manage')
    or public.user_has_permission(v_actor, 'admin.panel')
    or public.user_has_permission(v_actor, 'properties.manage')
  ) then
    raise exception 'forbidden';
  end if;

  select due_on into v_due from public.contract_payments where id = p_contract_payment_id;
  if v_due is null then
    raise exception 'payment not found';
  end if;

  for r in
    select * from (values
      ('d5', v_due - 5),
      ('d3', v_due - 3),
      ('d1', v_due - 1),
      ('d0', v_due),
      ('late', v_due + 1)
    ) as t(offset_label, scheduled_for)
  loop
    insert into public.payment_reminders (
      contract_payment_id, channel, offset_label, status, scheduled_for, payload
    )
    values (
      p_contract_payment_id, 'in_app', r.offset_label, 'scheduled', r.scheduled_for,
      jsonb_build_object('due_on', v_due)
    )
    on conflict (contract_payment_id, offset_label, channel) do nothing;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.schedule_rent_reminders(uuid) from public;
grant execute on function public.schedule_rent_reminders(uuid) to authenticated;

create or replace function public.set_feature_flag(p_code text, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'finance.manage required';
  end if;
  update public.platform_feature_flags
  set enabled = p_enabled,
      updated_at = timezone('utc', now()),
      updated_by = v_actor
  where code = p_code;
  if not found then
    raise exception 'flag not found';
  end if;
  perform public.write_audit_log(
    'feature_flag.updated',
    'platform_feature_flag',
    p_code,
    jsonb_build_object('enabled', p_enabled)
  );
end;
$$;

revoke all on function public.set_feature_flag(text, boolean) from public;
grant execute on function public.set_feature_flag(text, boolean) to authenticated;

-- ─── Seeds ──────────────────────────────────────────────────────────────────

insert into public.service_providers (
  business_name, category, description, phone, province, municipality,
  take_rate_code, rating, active, is_demo
) values
  ('Limpeza Express Luanda', 'cleaning', 'Limpeza residencial e pós-obra.', '+244900111001', 'Luanda', 'Luanda', 'cleaning_default', 4.6, true, true),
  ('Mudanças Angola Pro', 'moving', 'Mudanças locais e interprovinciais.', '+244900111002', 'Luanda', 'Viana', 'moving_default', 4.4, true, true),
  ('Pintura & Acabamentos Kz', 'painting', 'Pintura interior e exterior.', '+244900111003', 'Luanda', 'Belas', 'renovation_default', 4.2, true, true),
  ('ElectroFix 24h', 'electricity', 'Electricidade e urgências.', '+244900111004', 'Luanda', 'Cacuaco', 'cleaning_default', 4.5, true, true),
  ('AquaCanal', 'plumbing', 'Canalização e bombas.', '+244900111005', 'Luanda', 'Kilamba', 'cleaning_default', 4.3, true, true),
  ('Verde Jardins', 'gardening', 'Jardinagem e manutenção de espaços.', '+244900111006', 'Luanda', 'Talatona', 'cleaning_default', 4.1, true, true),
  ('SecureHome AO', 'security', 'Alarmes e vigilância.', '+244900111007', 'Luanda', 'Luanda', 'insurance_default', 4.0, true, true),
  ('Unitel Parceiro Kuteka', 'internet', 'Instalação fibra / pacotes habitação.', '+244900111008', 'Luanda', 'Luanda', 'internet_default', 4.7, true, true)
on conflict do nothing;

-- Seed in-app reminders for existing pending demo payments (no auth context in migrate)
insert into public.payment_reminders (
  contract_payment_id, channel, offset_label, status, scheduled_for, payload
)
select
  cp.id,
  'in_app',
  o.offset_label,
  'scheduled',
  o.scheduled_for,
  jsonb_build_object('due_on', cp.due_on, 'seed', true)
from (
  select id, due_on
  from public.contract_payments
  where status = 'pending' and due_on is not null
  order by due_on
  limit 20
) cp
cross join lateral (
  values
    ('d5', cp.due_on - 5),
    ('d3', cp.due_on - 3),
    ('d1', cp.due_on - 1),
    ('d0', cp.due_on),
    ('late', cp.due_on + 1)
) as o(offset_label, scheduled_for)
on conflict (contract_payment_id, offset_label, channel) do nothing;
