-- PRD-010 / ADR-015: Financial Architecture Phase 1
-- Ledger · Catalog · Pricing · Kuteka Pay (sandbox) · Credits · Commissions · Invoicing · Consents
-- Ref: docs/finance/ARQUITETURA_FINANCEIRA_KUTEKA.md v1.0
-- Phase 1: custody_mode = none (no escrow / no wallet holding funds)

-- ─── Permissions ────────────────────────────────────────────────────────────

insert into public.permissions (code, description)
values
  ('finance.manage', 'Configurar motor financeiro, preços, comissões e Super Admin'),
  ('finance.read', 'Consultar ledger, faturas e relatórios financeiros')
on conflict (code) do update
set description = excluded.description,
    updated_at = timezone('utc', now());

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('finance.manage', 'finance.read')
where r.code = 'super_administrator'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'finance.read'
where r.code = 'administrator'
on conflict do nothing;

-- ─── Product catalog ────────────────────────────────────────────────────────

create table if not exists public.finance_products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  category text not null
    check (category in (
      'mobility', 'protection', 'partner_plan', 'marketplace', 'plus',
      'commission', 'lead', 'analytics', 'academy', 'advertising', 'other'
    )),
  pricing_model text not null
    check (pricing_model in (
      'fixed', 'percentage', 'tiered', 'subscription', 'commission', 'free'
    )),
  buyer_roles text[] not null default '{}',
  country_code text not null default 'AO',
  currency text not null default 'AOA',
  tax_code text,
  refund_policy_code text not null default 'standard',
  kai_suggestible boolean not null default false,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

create index if not exists finance_products_category_idx
  on public.finance_products (category)
  where deleted_at is null;
create index if not exists finance_products_active_idx
  on public.finance_products (active)
  where deleted_at is null;

drop trigger if exists finance_products_set_updated_at on public.finance_products;
create trigger finance_products_set_updated_at
before update on public.finance_products
for each row execute function public.set_updated_at();

alter table public.finance_products enable row level security;

drop policy if exists finance_products_select on public.finance_products;
create policy finance_products_select
  on public.finance_products for select to authenticated
  using (
    deleted_at is null
    and (
      active = true
      or public.user_has_permission(auth.uid(), 'finance.read')
      or public.user_has_permission(auth.uid(), 'finance.manage')
    )
  );

drop policy if exists finance_products_write on public.finance_products;
create policy finance_products_write
  on public.finance_products for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

-- ─── Price rules (parametrizable engine) ────────────────────────────────────

create table if not exists public.finance_price_rules (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.finance_products (id) on delete cascade,
  code text not null,
  label text not null,
  country_code text not null default 'AO',
  currency text not null default 'AOA',
  amount numeric(14, 2),
  percentage numeric(8, 4),
  min_amount numeric(14, 2),
  max_amount numeric(14, 2),
  urgency_band text
    check (urgency_band is null or urgency_band in (
      'planned_90', 'priority_60', 'urgent_30', 'emergency_14'
    )),
  charge_event text not null default 'on_purchase'
    check (charge_event in (
      'on_purchase', 'on_success', 'subscription_cycle', 'on_completion', 'on_lead_accept'
    )),
  priority int not null default 100,
  active boolean not null default true,
  valid_from timestamptz,
  valid_until timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz,
  unique (product_id, code)
);

create index if not exists finance_price_rules_product_idx
  on public.finance_price_rules (product_id)
  where deleted_at is null and active = true;

drop trigger if exists finance_price_rules_set_updated_at on public.finance_price_rules;
create trigger finance_price_rules_set_updated_at
before update on public.finance_price_rules
for each row execute function public.set_updated_at();

alter table public.finance_price_rules enable row level security;

drop policy if exists finance_price_rules_select on public.finance_price_rules;
create policy finance_price_rules_select
  on public.finance_price_rules for select to authenticated
  using (deleted_at is null);

drop policy if exists finance_price_rules_write on public.finance_price_rules;
create policy finance_price_rules_write
  on public.finance_price_rules for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

-- ─── Commission rules ───────────────────────────────────────────────────────

create table if not exists public.finance_commission_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  category text not null,
  take_rate_pct numeric(8, 4),
  fixed_amount numeric(14, 2),
  currency text not null default 'AOA',
  country_code text not null default 'AO',
  payer_side text not null default 'provider'
    check (payer_side in ('client', 'partner', 'provider', 'advertiser', 'platform')),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

drop trigger if exists finance_commission_rules_set_updated_at on public.finance_commission_rules;
create trigger finance_commission_rules_set_updated_at
before update on public.finance_commission_rules
for each row execute function public.set_updated_at();

alter table public.finance_commission_rules enable row level security;

drop policy if exists finance_commission_rules_select on public.finance_commission_rules;
create policy finance_commission_rules_select
  on public.finance_commission_rules for select to authenticated
  using (
    deleted_at is null
    and (
      active = true
      or public.user_has_permission(auth.uid(), 'finance.read')
      or public.user_has_permission(auth.uid(), 'finance.manage')
    )
  );

drop policy if exists finance_commission_rules_write on public.finance_commission_rules;
create policy finance_commission_rules_write
  on public.finance_commission_rules for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

-- ─── Gateway configs (sandbox ready) ────────────────────────────────────────

create table if not exists public.finance_gateways (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  country_codes text[] not null default array['AO'],
  sandbox boolean not null default true,
  active boolean not null default true,
  supports_split boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

drop trigger if exists finance_gateways_set_updated_at on public.finance_gateways;
create trigger finance_gateways_set_updated_at
before update on public.finance_gateways
for each row execute function public.set_updated_at();

alter table public.finance_gateways enable row level security;

drop policy if exists finance_gateways_select on public.finance_gateways;
create policy finance_gateways_select
  on public.finance_gateways for select to authenticated
  using (deleted_at is null and (active = true or public.user_has_permission(auth.uid(), 'finance.manage')));

drop policy if exists finance_gateways_write on public.finance_gateways;
create policy finance_gateways_write
  on public.finance_gateways for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

-- ─── Ledger ─────────────────────────────────────────────────────────────────

create table if not exists public.finance_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null
    check (entry_type in (
      'charge', 'commission', 'payout_instruction', 'credit_grant', 'credit_redeem',
      'refund', 'adjustment', 'fee', 'writeoff'
    )),
  status text not null default 'pending'
    check (status in (
      'pending', 'authorized', 'captured', 'failed', 'refunded', 'cancelled'
    )),
  currency text not null default 'AOA',
  amount numeric(14, 2) not null check (amount >= 0),
  country_code text not null default 'AO',
  payer_type text,
  payer_id uuid,
  payee_type text,
  payee_id uuid,
  product_id uuid references public.finance_products (id),
  price_rule_id uuid references public.finance_price_rules (id),
  payment_intent_id uuid,
  order_ref text,
  gateway_code text,
  gateway_ref text,
  custody_mode text not null default 'none'
    check (custody_mode in ('none', 'escrow_future')),
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id)
);

create index if not exists finance_ledger_created_idx
  on public.finance_ledger_entries (created_at desc);
create index if not exists finance_ledger_status_idx
  on public.finance_ledger_entries (status);
create index if not exists finance_ledger_payer_idx
  on public.finance_ledger_entries (payer_id);
create index if not exists finance_ledger_type_idx
  on public.finance_ledger_entries (entry_type);

drop trigger if exists finance_ledger_set_updated_at on public.finance_ledger_entries;
create trigger finance_ledger_set_updated_at
before update on public.finance_ledger_entries
for each row execute function public.set_updated_at();

alter table public.finance_ledger_entries enable row level security;

drop policy if exists finance_ledger_select on public.finance_ledger_entries;
create policy finance_ledger_select
  on public.finance_ledger_entries for select to authenticated
  using (
    public.user_has_permission(auth.uid(), 'finance.read')
    or public.user_has_permission(auth.uid(), 'finance.manage')
    or payer_id = auth.uid()
    or payee_id = auth.uid()
  );

drop policy if exists finance_ledger_insert on public.finance_ledger_entries;
create policy finance_ledger_insert
  on public.finance_ledger_entries for insert to authenticated
  with check (
    public.user_has_permission(auth.uid(), 'finance.manage')
    or payer_id = auth.uid()
  );

drop policy if exists finance_ledger_update on public.finance_ledger_entries;
create policy finance_ledger_update
  on public.finance_ledger_entries for update to authenticated
  using (
    public.user_has_permission(auth.uid(), 'finance.manage')
  )
  with check (
    public.user_has_permission(auth.uid(), 'finance.manage')
  );

-- ─── Payment intents (Kuteka Pay) ───────────────────────────────────────────

create table if not exists public.finance_payment_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid references public.finance_products (id),
  price_rule_id uuid references public.finance_price_rules (id),
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'AOA',
  country_code text not null default 'AO',
  status text not null default 'created'
    check (status in (
      'created', 'awaiting_payment', 'processing', 'succeeded', 'failed', 'cancelled', 'expired'
    )),
  gateway_code text,
  gateway_ref text,
  sandbox boolean not null default true,
  custody_mode text not null default 'none'
    check (custody_mode in ('none', 'escrow_future')),
  quote_snapshot jsonb not null default '{}'::jsonb,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id)
);

create index if not exists finance_payment_intents_user_idx
  on public.finance_payment_intents (user_id, created_at desc);

drop trigger if exists finance_payment_intents_set_updated_at on public.finance_payment_intents;
create trigger finance_payment_intents_set_updated_at
before update on public.finance_payment_intents
for each row execute function public.set_updated_at();

alter table public.finance_payment_intents enable row level security;

drop policy if exists finance_payment_intents_select on public.finance_payment_intents;
create policy finance_payment_intents_select
  on public.finance_payment_intents for select to authenticated
  using (
    user_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'finance.read')
    or public.user_has_permission(auth.uid(), 'finance.manage')
  );

drop policy if exists finance_payment_intents_insert on public.finance_payment_intents;
create policy finance_payment_intents_insert
  on public.finance_payment_intents for insert to authenticated
  with check (user_id = auth.uid() or public.user_has_permission(auth.uid(), 'finance.manage'));

drop policy if exists finance_payment_intents_update on public.finance_payment_intents;
create policy finance_payment_intents_update
  on public.finance_payment_intents for update to authenticated
  using (
    user_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'finance.manage')
  )
  with check (
    user_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'finance.manage')
  );

-- FK ledger → payment intent (after table exists)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'finance_ledger_payment_intent_fk'
  ) then
    alter table public.finance_ledger_entries
      add constraint finance_ledger_payment_intent_fk
      foreign key (payment_intent_id) references public.finance_payment_intents (id)
      on delete set null;
  end if;
end $$;

-- ─── Credits ────────────────────────────────────────────────────────────────

create table if not exists public.finance_credit_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  balance numeric(14, 2) not null default 0 check (balance >= 0),
  currency text not null default 'AOA',
  country_code text not null default 'AO',
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.finance_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.finance_credit_accounts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  direction text not null check (direction in ('grant', 'redeem', 'expire', 'adjust')),
  amount numeric(14, 2) not null check (amount > 0),
  balance_after numeric(14, 2) not null,
  reason text,
  expires_at timestamptz,
  ledger_entry_id uuid references public.finance_ledger_entries (id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id)
);

create index if not exists finance_credit_tx_user_idx
  on public.finance_credit_transactions (user_id, created_at desc);

alter table public.finance_credit_accounts enable row level security;
alter table public.finance_credit_transactions enable row level security;

drop policy if exists finance_credit_accounts_select on public.finance_credit_accounts;
create policy finance_credit_accounts_select
  on public.finance_credit_accounts for select to authenticated
  using (
    user_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'finance.read')
    or public.user_has_permission(auth.uid(), 'finance.manage')
  );

drop policy if exists finance_credit_accounts_write on public.finance_credit_accounts;
create policy finance_credit_accounts_write
  on public.finance_credit_accounts for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

drop policy if exists finance_credit_tx_select on public.finance_credit_transactions;
create policy finance_credit_tx_select
  on public.finance_credit_transactions for select to authenticated
  using (
    user_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'finance.read')
    or public.user_has_permission(auth.uid(), 'finance.manage')
  );

drop policy if exists finance_credit_tx_insert on public.finance_credit_transactions;
create policy finance_credit_tx_insert
  on public.finance_credit_transactions for insert to authenticated
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

-- ─── Invoices ───────────────────────────────────────────────────────────────

create table if not exists public.finance_invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  payment_intent_id uuid references public.finance_payment_intents (id),
  status text not null default 'issued'
    check (status in ('draft', 'issued', 'paid', 'void', 'refunded')),
  currency text not null default 'AOA',
  country_code text not null default 'AO',
  subtotal numeric(14, 2) not null default 0,
  tax_amount numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  buyer_snapshot jsonb not null default '{}'::jsonb,
  lines jsonb not null default '[]'::jsonb,
  issued_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id)
);

create index if not exists finance_invoices_user_idx
  on public.finance_invoices (user_id, issued_at desc);

drop trigger if exists finance_invoices_set_updated_at on public.finance_invoices;
create trigger finance_invoices_set_updated_at
before update on public.finance_invoices
for each row execute function public.set_updated_at();

alter table public.finance_invoices enable row level security;

drop policy if exists finance_invoices_select on public.finance_invoices;
create policy finance_invoices_select
  on public.finance_invoices for select to authenticated
  using (
    user_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'finance.read')
    or public.user_has_permission(auth.uid(), 'finance.manage')
  );

drop policy if exists finance_invoices_write on public.finance_invoices;
create policy finance_invoices_write
  on public.finance_invoices for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

-- ─── Commercial consents ────────────────────────────────────────────────────

create table if not exists public.finance_commercial_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scope text not null
    check (scope in (
      'kai_suggestions', 'partner_offers', 'provider_offers', 'insurance', 'telecom', 'analytics_share'
    )),
  granted boolean not null default false,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, scope)
);

drop trigger if exists finance_commercial_consents_set_updated_at on public.finance_commercial_consents;
create trigger finance_commercial_consents_set_updated_at
before update on public.finance_commercial_consents
for each row execute function public.set_updated_at();

alter table public.finance_commercial_consents enable row level security;

drop policy if exists finance_consents_select on public.finance_commercial_consents;
create policy finance_consents_select
  on public.finance_commercial_consents for select to authenticated
  using (
    user_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'finance.manage')
  );

drop policy if exists finance_consents_upsert on public.finance_commercial_consents;
create policy finance_consents_insert
  on public.finance_commercial_consents for insert to authenticated
  with check (user_id = auth.uid());

create policy finance_consents_update
  on public.finance_commercial_consents for update to authenticated
  using (user_id = auth.uid() or public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (user_id = auth.uid() or public.user_has_permission(auth.uid(), 'finance.manage'));

-- ─── Campaigns (basic) ──────────────────────────────────────────────────────

create table if not exists public.finance_campaigns (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  discount_pct numeric(8, 4),
  discount_amount numeric(14, 2),
  credit_grant numeric(14, 2),
  product_codes text[] not null default '{}',
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  deleted_at timestamptz
);

drop trigger if exists finance_campaigns_set_updated_at on public.finance_campaigns;
create trigger finance_campaigns_set_updated_at
before update on public.finance_campaigns
for each row execute function public.set_updated_at();

alter table public.finance_campaigns enable row level security;

drop policy if exists finance_campaigns_select on public.finance_campaigns;
create policy finance_campaigns_select
  on public.finance_campaigns for select to authenticated
  using (deleted_at is null and (active = true or public.user_has_permission(auth.uid(), 'finance.manage')));

drop policy if exists finance_campaigns_write on public.finance_campaigns;
create policy finance_campaigns_write
  on public.finance_campaigns for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

-- ─── RPCs ───────────────────────────────────────────────────────────────────

create or replace function public.finance_quote_price(
  p_product_code text,
  p_urgency_band text default null,
  p_country_code text default 'AO',
  p_currency text default 'AOA'
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_product public.finance_products%rowtype;
  v_rule public.finance_price_rules%rowtype;
begin
  select * into v_product
  from public.finance_products
  where code = p_product_code
    and deleted_at is null
    and active = true;

  if not found then
    raise exception 'product not found';
  end if;

  select * into v_rule
  from public.finance_price_rules r
  where r.product_id = v_product.id
    and r.deleted_at is null
    and r.active = true
    and r.country_code = coalesce(p_country_code, v_product.country_code)
    and r.currency = coalesce(p_currency, v_product.currency)
    and (
      p_urgency_band is null
      or r.urgency_band is null
      or r.urgency_band = p_urgency_band
    )
    and (r.valid_from is null or r.valid_from <= timezone('utc', now()))
    and (r.valid_until is null or r.valid_until >= timezone('utc', now()))
  order by
    case when r.urgency_band = p_urgency_band then 0 else 1 end,
    r.priority asc,
    r.created_at desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'productCode', v_product.code,
      'message', 'no price rule'
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'productId', v_product.id,
    'productCode', v_product.code,
    'productName', v_product.name,
    'priceRuleId', v_rule.id,
    'priceRuleCode', v_rule.code,
    'amount', v_rule.amount,
    'percentage', v_rule.percentage,
    'currency', v_rule.currency,
    'countryCode', v_rule.country_code,
    'chargeEvent', v_rule.charge_event,
    'urgencyBand', v_rule.urgency_band,
    'label', v_rule.label
  );
end;
$$;

revoke all on function public.finance_quote_price(text, text, text, text) from public;
grant execute on function public.finance_quote_price(text, text, text, text) to authenticated;

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
  v_actor uuid := auth.uid();
  v_quote jsonb;
  v_intent_id uuid;
  v_ledger_id uuid;
  v_amount numeric(14, 2);
  v_currency text;
  v_product_id uuid;
  v_rule_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  v_quote := public.finance_quote_price(p_product_code, p_urgency_band, 'AO', 'AOA');
  if coalesce((v_quote->>'ok')::boolean, false) is not true then
    raise exception 'unable to quote product';
  end if;

  v_amount := coalesce((v_quote->>'amount')::numeric, 0);
  v_currency := coalesce(v_quote->>'currency', 'AOA');
  v_product_id := (v_quote->>'productId')::uuid;
  v_rule_id := (v_quote->>'priceRuleId')::uuid;

  insert into public.finance_payment_intents (
    user_id, product_id, price_rule_id, amount, currency, country_code,
    status, gateway_code, gateway_ref, sandbox, custody_mode, quote_snapshot,
    description, created_by, updated_by
  )
  values (
    v_actor, v_product_id, v_rule_id, v_amount, v_currency, 'AO',
    'awaiting_payment', coalesce(nullif(p_gateway_code, ''), 'sandbox'),
    'SANDBOX-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
    true, 'none', v_quote,
    coalesce(p_description, v_quote->>'productName'),
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
    coalesce(nullif(p_gateway_code, ''), 'sandbox'),
    null, 'none', coalesce(p_description, v_quote->>'productName'),
    jsonb_build_object('sandbox', true, 'quote', v_quote),
    v_actor, v_actor
  )
  returning id into v_ledger_id;

  perform public.write_audit_log(
    'finance.payment_intent_created',
    'finance_payment_intent',
    v_intent_id::text,
    jsonb_build_object('product', p_product_code, 'amount', v_amount, 'sandbox', true)
  );

  return jsonb_build_object(
    'ok', true,
    'paymentIntentId', v_intent_id,
    'ledgerEntryId', v_ledger_id,
    'amount', v_amount,
    'currency', v_currency,
    'status', 'awaiting_payment',
    'sandbox', true,
    'quote', v_quote
  );
end;
$$;

revoke all on function public.finance_create_sandbox_payment(text, text, text, text) from public;
grant execute on function public.finance_create_sandbox_payment(text, text, text, text) to authenticated;

create or replace function public.finance_capture_sandbox_payment(p_intent_id uuid)
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

  if v_intent.status = 'succeeded' then
    return jsonb_build_object('ok', true, 'status', 'succeeded', 'paymentIntentId', v_intent.id);
  end if;

  update public.finance_payment_intents
  set status = 'succeeded',
      updated_by = v_actor,
      gateway_ref = coalesce(gateway_ref, 'SANDBOX-OK')
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
    v_number,
    v_intent.user_id,
    v_intent.id,
    'paid',
    v_intent.currency,
    v_intent.country_code,
    v_intent.amount,
    0,
    v_intent.amount,
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

  perform public.write_audit_log(
    'finance.payment_captured',
    'finance_payment_intent',
    v_intent.id::text,
    jsonb_build_object('invoice_id', v_invoice_id, 'sandbox', true)
  );

  return jsonb_build_object(
    'ok', true,
    'status', 'succeeded',
    'paymentIntentId', v_intent.id,
    'invoiceId', v_invoice_id,
    'invoiceNumber', v_number
  );
end;
$$;

revoke all on function public.finance_capture_sandbox_payment(uuid) from public;
grant execute on function public.finance_capture_sandbox_payment(uuid) to authenticated;

create or replace function public.finance_grant_credits(
  p_user_id uuid,
  p_amount numeric,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_account_id uuid;
  v_balance numeric(14, 2);
  v_ledger_id uuid;
  v_tx_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'finance.manage required';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount required';
  end if;

  insert into public.finance_credit_accounts (user_id, balance, currency, country_code)
  values (p_user_id, 0, 'AOA', 'AO')
  on conflict (user_id) do nothing;

  select id, balance into v_account_id, v_balance
  from public.finance_credit_accounts
  where user_id = p_user_id
  for update;

  v_balance := coalesce(v_balance, 0) + p_amount;

  update public.finance_credit_accounts
  set balance = v_balance,
      updated_at = timezone('utc', now())
  where id = v_account_id;

  insert into public.finance_ledger_entries (
    entry_type, status, currency, amount, country_code,
    payer_type, payee_type, payee_id, custody_mode, description,
    metadata, created_by, updated_by
  )
  values (
    'credit_grant', 'captured', 'AOA', p_amount, 'AO',
    'platform', 'user', p_user_id, 'none', coalesce(p_reason, 'Kuteka Credits'),
    jsonb_build_object('reason', p_reason), v_actor, v_actor
  )
  returning id into v_ledger_id;

  insert into public.finance_credit_transactions (
    account_id, user_id, direction, amount, balance_after, reason, ledger_entry_id, created_by
  )
  values (
    v_account_id, p_user_id, 'grant', p_amount, v_balance, p_reason, v_ledger_id, v_actor
  )
  returning id into v_tx_id;

  return jsonb_build_object(
    'ok', true,
    'accountId', v_account_id,
    'balance', v_balance,
    'transactionId', v_tx_id
  );
end;
$$;

revoke all on function public.finance_grant_credits(uuid, numeric, text) from public;
grant execute on function public.finance_grant_credits(uuid, numeric, text) to authenticated;

create or replace function public.finance_revenue_snapshot()
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
    'capturedCharges', (
      select coalesce(sum(amount), 0) from public.finance_ledger_entries
      where entry_type = 'charge' and status = 'captured'
    ),
    'pendingCharges', (
      select coalesce(sum(amount), 0) from public.finance_ledger_entries
      where entry_type = 'charge' and status = 'pending'
    ),
    'commissions', (
      select coalesce(sum(amount), 0) from public.finance_ledger_entries
      where entry_type = 'commission' and status = 'captured'
    ),
    'creditsGranted', (
      select coalesce(sum(amount), 0) from public.finance_ledger_entries
      where entry_type = 'credit_grant' and status = 'captured'
    ),
    'paymentIntents', (select count(*) from public.finance_payment_intents),
    'invoices', (select count(*) from public.finance_invoices),
    'activeProducts', (
      select count(*) from public.finance_products where active and deleted_at is null
    ),
    'sandboxGateways', (
      select count(*) from public.finance_gateways where sandbox and active and deleted_at is null
    ),
    'currency', 'AOA',
    'custodyMode', 'none'
  );
end;
$$;

revoke all on function public.finance_revenue_snapshot() from public;
grant execute on function public.finance_revenue_snapshot() to authenticated;

-- ─── Seeds ──────────────────────────────────────────────────────────────────

insert into public.finance_gateways (code, name, country_codes, sandbox, active, supports_split, config)
values
  ('sandbox', 'Kuteka Pay Sandbox', array['AO','*'], true, true, false, '{"mode":"test"}'::jsonb),
  ('multicaixa', 'Multicaixa Express', array['AO'], true, true, false, '{"mode":"sandbox","ready":false}'::jsonb),
  ('emis', 'EMIS', array['AO'], true, true, false, '{"mode":"sandbox","ready":false}'::jsonb),
  ('bank_transfer', 'Transferência / Referência bancária', array['AO'], true, true, false, '{"mode":"manual_proof"}'::jsonb),
  ('stripe', 'Stripe', array['*'], true, true, true, '{"mode":"sandbox"}'::jsonb),
  ('wise', 'Wise', array['*'], true, false, false, '{"mode":"future"}'::jsonb)
on conflict (code) do update
set name = excluded.name,
    sandbox = excluded.sandbox,
    active = excluded.active,
    config = excluded.config;

-- Products + price rules
do $$
declare
  v_id uuid;
begin
  -- Smart move opening fees by urgency
  insert into public.finance_products (
    code, name, description, category, pricing_model, buyer_roles,
    country_code, currency, kai_suggestible, active
  ) values
    ('smart_move.open', 'Mudança Inteligente — Taxa de abertura',
     'Activa a procura Kuteka. Taxa de sucesso cobrada à parte.', 'mobility', 'fixed',
     array['client'], 'AO', 'AOA', true, true),
    ('smart_move.success', 'Mudança Inteligente — Taxa de sucesso',
     'Cobrada apenas quando a Kuteka encontra solução aceite.', 'mobility', 'fixed',
     array['client'], 'AO', 'AOA', false, true),
    ('find_home.priority', 'Encontrar Casa — Prioridade',
     'Prioridade na procura de habitação compatível.', 'mobility', 'fixed',
     array['client'], 'AO', 'AOA', true, true),
    ('kuteka_plus.monthly', 'Kuteka Plus (mensal)',
     'Plano opcional: prioridade, descontos, créditos e assistência.', 'plus', 'subscription',
     array['client','patrimonial_partner'], 'AO', 'AOA', true, true),
    ('partner.bronze.monthly', 'Plano Parceiro Bronze',
     'Fotografia, promoção e filtragem de clientes.', 'partner_plan', 'subscription',
     array['patrimonial_partner'], 'AO', 'AOA', true, true),
    ('partner.silver.monthly', 'Plano Parceiro Silver',
     'Inclui visitas, contratos e apoio alargado.', 'partner_plan', 'subscription',
     array['patrimonial_partner'], 'AO', 'AOA', true, true),
    ('partner.gold.monthly', 'Plano Parceiro Gold',
     'Gestão completa — o proprietário recebe o rendimento.', 'partner_plan', 'subscription',
     array['patrimonial_partner'], 'AO', 'AOA', true, true)
  on conflict (code) do update
  set name = excluded.name,
      description = excluded.description,
      active = true;

  -- Price rules for smart_move.open
  select id into v_id from public.finance_products where code = 'smart_move.open';
  insert into public.finance_price_rules (
    product_id, code, label, amount, currency, urgency_band, charge_event, priority
  ) values
    (v_id, 'open_planned_90', 'Abertura 61–90 dias', 5000, 'AOA', 'planned_90', 'on_purchase', 10),
    (v_id, 'open_priority_60', 'Abertura 31–60 dias', 7500, 'AOA', 'priority_60', 'on_purchase', 10),
    (v_id, 'open_urgent_30', 'Abertura 15–30 dias', 10000, 'AOA', 'urgent_30', 'on_purchase', 10),
    (v_id, 'open_emergency_14', 'Abertura 1–14 dias', 15000, 'AOA', 'emergency_14', 'on_purchase', 10)
  on conflict (product_id, code) do update
  set amount = excluded.amount, label = excluded.label, active = true;

  select id into v_id from public.finance_products where code = 'smart_move.success';
  insert into public.finance_price_rules (
    product_id, code, label, amount, currency, urgency_band, charge_event, priority
  ) values
    (v_id, 'success_planned_90', 'Sucesso 61–90 dias', 10000, 'AOA', 'planned_90', 'on_success', 10),
    (v_id, 'success_priority_60', 'Sucesso 31–60 dias', 15000, 'AOA', 'priority_60', 'on_success', 10),
    (v_id, 'success_urgent_30', 'Sucesso 15–30 dias', 20000, 'AOA', 'urgent_30', 'on_success', 10),
    (v_id, 'success_emergency_14', 'Sucesso 1–14 dias', 25000, 'AOA', 'emergency_14', 'on_success', 10)
  on conflict (product_id, code) do update
  set amount = excluded.amount, active = true;

  select id into v_id from public.finance_products where code = 'find_home.priority';
  insert into public.finance_price_rules (
    product_id, code, label, amount, currency, charge_event, priority
  ) values
    (v_id, 'find_home_default', 'Prioridade Encontrar Casa', 3000, 'AOA', 'on_purchase', 10)
  on conflict (product_id, code) do update set amount = excluded.amount, active = true;

  select id into v_id from public.finance_products where code = 'kuteka_plus.monthly';
  insert into public.finance_price_rules (
    product_id, code, label, amount, currency, charge_event, priority
  ) values
    (v_id, 'plus_monthly', 'Kuteka Plus mensal', 5000, 'AOA', 'subscription_cycle', 10)
  on conflict (product_id, code) do update set amount = excluded.amount, active = true;

  select id into v_id from public.finance_products where code = 'partner.bronze.monthly';
  insert into public.finance_price_rules (product_id, code, label, amount, currency, charge_event, priority)
  values (v_id, 'bronze_monthly', 'Bronze mensal', 10000, 'AOA', 'subscription_cycle', 10)
  on conflict (product_id, code) do update set amount = excluded.amount, active = true;

  select id into v_id from public.finance_products where code = 'partner.silver.monthly';
  insert into public.finance_price_rules (product_id, code, label, amount, currency, charge_event, priority)
  values (v_id, 'silver_monthly', 'Silver mensal', 25000, 'AOA', 'subscription_cycle', 10)
  on conflict (product_id, code) do update set amount = excluded.amount, active = true;

  select id into v_id from public.finance_products where code = 'partner.gold.monthly';
  insert into public.finance_price_rules (product_id, code, label, amount, currency, charge_event, priority)
  values (v_id, 'gold_monthly', 'Gold mensal', 50000, 'AOA', 'subscription_cycle', 10)
  on conflict (product_id, code) do update set amount = excluded.amount, active = true;
end $$;

insert into public.finance_commission_rules (
  code, label, category, take_rate_pct, currency, payer_side, active
) values
  ('cleaning_default', 'Limpeza', 'cleaning', 12.0000, 'AOA', 'provider', true),
  ('moving_default', 'Mudanças físicas', 'moving', 9.0000, 'AOA', 'provider', true),
  ('insurance_default', 'Seguros', 'insurance', 12.5000, 'AOA', 'provider', true),
  ('internet_default', 'Internet / Telecom', 'telecom', 10.0000, 'AOA', 'provider', true),
  ('renovation_default', 'Remodelação', 'renovation', 8.0000, 'AOA', 'provider', true)
on conflict (code) do update
set take_rate_pct = excluded.take_rate_pct,
    active = true;

insert into public.finance_campaigns (code, name, description, credit_grant, active)
values (
  'welcome_credits',
  'Boas-vindas Kuteka',
  'Campanha seed: créditos de boas-vindas para demos.',
  2000,
  true
)
on conflict (code) do update set active = true;

-- Ensure demo.super has finance permissions (already via role)
-- Grant welcome credits to demo.super for Command Center demos
do $$
declare
  v_super uuid;
  v_account uuid;
begin
  select id into v_super from auth.users where email = 'demo.super@kuteka.local';
  if v_super is null then
    return;
  end if;

  insert into public.finance_credit_accounts (user_id, balance, currency, country_code)
  values (v_super, 5000, 'AOA', 'AO')
  on conflict (user_id) do update
  set balance = greatest(public.finance_credit_accounts.balance, 5000);

  -- Sample captured charge for revenue snapshot demo
  if not exists (
    select 1 from public.finance_ledger_entries
    where description = 'Seed demo — Kuteka Plus'
      and payer_id = v_super
  ) then
    insert into public.finance_ledger_entries (
      entry_type, status, currency, amount, country_code,
      payer_type, payer_id, payee_type, custody_mode, description, metadata
    ) values (
      'charge', 'captured', 'AOA', 5000, 'AO',
      'user', v_super, 'platform', 'none', 'Seed demo — Kuteka Plus',
      jsonb_build_object('seed', true)
    );
  end if;
end $$;

comment on table public.finance_ledger_entries is
  'ADR-015: Livro-razão financeiro — fonte de verdade (Fase 1 custody=none).';
comment on table public.finance_payment_intents is
  'ADR-015: Kuteka Pay intents — sandbox até activação de gateways reais.';
