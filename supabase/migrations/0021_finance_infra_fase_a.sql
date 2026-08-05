-- Fase A — Consolidação da Infraestrutura Financeira (transversal)
-- Ref: Arquitectura Financeira v1.0 · nova ordem PO 2026-08-05 · ADR-017
-- Princípio: infraestrutura genérica reutilizável por qualquer serviço futuro
-- (não soluções isoladas). Custódia continua desligada (custody_mode = none).

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Ledger — novos tipos e estados
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.finance_ledger_entries
  drop constraint if exists finance_ledger_entries_entry_type_check;

alter table public.finance_ledger_entries
  add constraint finance_ledger_entries_entry_type_check
  check (entry_type in (
    'charge', 'commission', 'payout_instruction', 'credit_grant', 'credit_redeem',
    'refund', 'adjustment', 'fee', 'writeoff', 'chargeback', 'dispute_hold', 'reversal'
  ));

alter table public.finance_ledger_entries
  drop constraint if exists finance_ledger_entries_status_check;

alter table public.finance_ledger_entries
  add constraint finance_ledger_entries_status_check
  check (status in (
    'pending', 'authorized', 'captured', 'failed', 'refunded', 'cancelled',
    'disputed', 'reversed', 'reconciled'
  ));

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Créditos — direcção adicional para reembolsos
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.finance_credit_transactions
  drop constraint if exists finance_credit_transactions_direction_check;

alter table public.finance_credit_transactions
  add constraint finance_credit_transactions_direction_check
  check (direction in ('grant', 'redeem', 'expire', 'adjust', 'refund_credit'));

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Faturação — PDF, email e numeração sequencial
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.finance_invoices
  add column if not exists pdf_html text,
  add column if not exists pdf_generated_at timestamptz,
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_to text,
  add column if not exists sequence_year int,
  add column if not exists sequence_number int,
  add column if not exists void_reason text;

create table if not exists public.finance_invoice_sequences (
  country_code text not null default 'AO',
  year int not null,
  last_number int not null default 0,
  prefix text not null default 'KT',
  primary key (country_code, year)
);

alter table public.finance_invoice_sequences enable row level security;

drop policy if exists finance_invoice_sequences_manage on public.finance_invoice_sequences;
create policy finance_invoice_sequences_manage
  on public.finance_invoice_sequences for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

drop policy if exists finance_invoice_sequences_read on public.finance_invoice_sequences;
create policy finance_invoice_sequences_read
  on public.finance_invoice_sequences for select to authenticated
  using (
    public.user_has_permission(auth.uid(), 'finance.read')
    or public.user_has_permission(auth.uid(), 'finance.manage')
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Reembolsos
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.finance_refunds (
  id uuid primary key default gen_random_uuid(),
  ledger_entry_id uuid not null references public.finance_ledger_entries (id),
  payment_intent_id uuid references public.finance_payment_intents (id),
  invoice_id uuid references public.finance_invoices (id),
  user_id uuid not null references auth.users (id),
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'AOA',
  mode text not null default 'credits'
    check (mode in ('credits', 'gateway', 'adjustment')),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'completed', 'rejected', 'cancelled')),
  reason text not null,
  credit_transaction_id uuid references public.finance_credit_transactions (id),
  refund_ledger_entry_id uuid references public.finance_ledger_entries (id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  resolved_by uuid references auth.users (id),
  resolved_at timestamptz
);

create index if not exists finance_refunds_user_idx on public.finance_refunds (user_id, created_at desc);
create index if not exists finance_refunds_status_idx on public.finance_refunds (status);

drop trigger if exists finance_refunds_set_updated_at on public.finance_refunds;
create trigger finance_refunds_set_updated_at
before update on public.finance_refunds
for each row execute function public.set_updated_at();

alter table public.finance_refunds enable row level security;

drop policy if exists finance_refunds_select on public.finance_refunds;
create policy finance_refunds_select
  on public.finance_refunds for select to authenticated
  using (
    user_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'finance.read')
    or public.user_has_permission(auth.uid(), 'finance.manage')
  );

drop policy if exists finance_refunds_manage on public.finance_refunds;
create policy finance_refunds_manage
  on public.finance_refunds for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. Disputas / chargebacks
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.finance_disputes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  ledger_entry_id uuid references public.finance_ledger_entries (id),
  payment_intent_id uuid references public.finance_payment_intents (id),
  user_id uuid not null references auth.users (id),
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'AOA',
  status text not null default 'open'
    check (status in ('open', 'investigating', 'won', 'lost', 'settled', 'cancelled')),
  reason text not null,
  resolution_notes text,
  metadata jsonb not null default '{}'::jsonb,
  opened_at timestamptz not null default timezone('utc', now()),
  closed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  assigned_to uuid references auth.users (id)
);

create index if not exists finance_disputes_status_idx on public.finance_disputes (status, opened_at desc);

drop trigger if exists finance_disputes_set_updated_at on public.finance_disputes;
create trigger finance_disputes_set_updated_at
before update on public.finance_disputes
for each row execute function public.set_updated_at();

alter table public.finance_disputes enable row level security;

drop policy if exists finance_disputes_select on public.finance_disputes;
create policy finance_disputes_select
  on public.finance_disputes for select to authenticated
  using (
    user_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'finance.read')
    or public.user_has_permission(auth.uid(), 'finance.manage')
  );

drop policy if exists finance_disputes_manage on public.finance_disputes;
create policy finance_disputes_manage
  on public.finance_disputes for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. Reconciliação (runs + items)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.finance_reconciliation_runs (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  period_start date not null,
  period_end date not null,
  gateway_code text,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed')),
  matched_count int not null default 0,
  unmatched_count int not null default 0,
  total_amount numeric(14, 2) not null default 0,
  currency text not null default 'AOA',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_by uuid references auth.users (id)
);

create index if not exists finance_reconciliation_runs_idx
  on public.finance_reconciliation_runs (created_at desc);

alter table public.finance_reconciliation_runs enable row level security;

drop policy if exists finance_reconciliation_runs_read on public.finance_reconciliation_runs;
create policy finance_reconciliation_runs_read
  on public.finance_reconciliation_runs for select to authenticated
  using (
    public.user_has_permission(auth.uid(), 'finance.read')
    or public.user_has_permission(auth.uid(), 'finance.manage')
  );

drop policy if exists finance_reconciliation_runs_manage on public.finance_reconciliation_runs;
create policy finance_reconciliation_runs_manage
  on public.finance_reconciliation_runs for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

create table if not exists public.finance_reconciliation_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.finance_reconciliation_runs (id) on delete cascade,
  ledger_entry_id uuid references public.finance_ledger_entries (id),
  gateway_ref text,
  expected_amount numeric(14, 2),
  gateway_amount numeric(14, 2),
  status text not null default 'unmatched'
    check (status in ('matched', 'unmatched', 'missing', 'extra')),
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists finance_reconciliation_items_run_idx
  on public.finance_reconciliation_items (run_id);

alter table public.finance_reconciliation_items enable row level security;

drop policy if exists finance_reconciliation_items_read on public.finance_reconciliation_items;
create policy finance_reconciliation_items_read
  on public.finance_reconciliation_items for select to authenticated
  using (
    public.user_has_permission(auth.uid(), 'finance.read')
    or public.user_has_permission(auth.uid(), 'finance.manage')
  );

drop policy if exists finance_reconciliation_items_manage on public.finance_reconciliation_items;
create policy finance_reconciliation_items_manage
  on public.finance_reconciliation_items for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. Sinais de fraude
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.finance_fraud_flags (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  entity_type text not null
    check (entity_type in (
      'ledger_entry', 'payment_intent', 'user', 'refund', 'dispute', 'service_order', 'other'
    )),
  entity_id uuid,
  user_id uuid references auth.users (id),
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'confirmed', 'dismissed')),
  reason text not null,
  signals jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  opened_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  resolved_by uuid references auth.users (id)
);

create index if not exists finance_fraud_flags_status_idx
  on public.finance_fraud_flags (status, severity, opened_at desc);

drop trigger if exists finance_fraud_flags_set_updated_at on public.finance_fraud_flags;
create trigger finance_fraud_flags_set_updated_at
before update on public.finance_fraud_flags
for each row execute function public.set_updated_at();

alter table public.finance_fraud_flags enable row level security;

drop policy if exists finance_fraud_flags_read on public.finance_fraud_flags;
create policy finance_fraud_flags_read
  on public.finance_fraud_flags for select to authenticated
  using (
    public.user_has_permission(auth.uid(), 'finance.read')
    or public.user_has_permission(auth.uid(), 'finance.manage')
  );

drop policy if exists finance_fraud_flags_manage on public.finance_fraud_flags;
create policy finance_fraud_flags_manage
  on public.finance_fraud_flags for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. Regras KAI (motor de sugestões comerciais)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.finance_kai_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  description text,
  trigger_event text not null,
  target_product_code text references public.finance_products (code),
  target_segment text,
  consent_scope text,
  priority int not null default 100,
  active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

create index if not exists finance_kai_rules_trigger_idx
  on public.finance_kai_rules (trigger_event)
  where deleted_at is null and active;

drop trigger if exists finance_kai_rules_set_updated_at on public.finance_kai_rules;
create trigger finance_kai_rules_set_updated_at
before update on public.finance_kai_rules
for each row execute function public.set_updated_at();

alter table public.finance_kai_rules enable row level security;

drop policy if exists finance_kai_rules_select on public.finance_kai_rules;
create policy finance_kai_rules_select
  on public.finance_kai_rules for select to authenticated
  using (
    deleted_at is null
    and (
      active = true
      or public.user_has_permission(auth.uid(), 'finance.read')
      or public.user_has_permission(auth.uid(), 'finance.manage')
    )
  );

drop policy if exists finance_kai_rules_write on public.finance_kai_rules;
create policy finance_kai_rules_write
  on public.finance_kai_rules for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. CRM financeiro (parceiros, prestadores, empresas, investidores)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.finance_crm_accounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  account_type text not null
    check (account_type in ('partner', 'provider', 'enterprise', 'investor')),
  service_provider_id uuid references public.service_providers (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  contact_email text,
  contact_phone text,
  country_code text not null default 'AO',
  status text not null default 'active'
    check (status in ('lead', 'prospect', 'active', 'churned', 'archived')),
  owner_user_id uuid references auth.users (id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

create index if not exists finance_crm_accounts_type_idx
  on public.finance_crm_accounts (account_type, status)
  where deleted_at is null;

drop trigger if exists finance_crm_accounts_set_updated_at on public.finance_crm_accounts;
create trigger finance_crm_accounts_set_updated_at
before update on public.finance_crm_accounts
for each row execute function public.set_updated_at();

alter table public.finance_crm_accounts enable row level security;

drop policy if exists finance_crm_accounts_read on public.finance_crm_accounts;
create policy finance_crm_accounts_read
  on public.finance_crm_accounts for select to authenticated
  using (
    deleted_at is null
    and (
      public.user_has_permission(auth.uid(), 'finance.read')
      or public.user_has_permission(auth.uid(), 'finance.manage')
    )
  );

drop policy if exists finance_crm_accounts_manage on public.finance_crm_accounts;
create policy finance_crm_accounts_manage
  on public.finance_crm_accounts for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. Exportações contabilísticas
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.finance_accounting_exports (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  period_start date not null,
  period_end date not null,
  format text not null default 'csv'
    check (format in ('csv', 'json', 'xml', 'saft')),
  status text not null default 'generated'
    check (status in ('pending', 'generated', 'failed')),
  content text,
  row_count int not null default 0,
  total_amount numeric(14, 2) not null default 0,
  currency text not null default 'AOA',
  metadata jsonb not null default '{}'::jsonb,
  generated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id)
);

create index if not exists finance_accounting_exports_idx
  on public.finance_accounting_exports (created_at desc);

alter table public.finance_accounting_exports enable row level security;

drop policy if exists finance_accounting_exports_read on public.finance_accounting_exports;
create policy finance_accounting_exports_read
  on public.finance_accounting_exports for select to authenticated
  using (
    public.user_has_permission(auth.uid(), 'finance.read')
    or public.user_has_permission(auth.uid(), 'finance.manage')
  );

drop policy if exists finance_accounting_exports_manage on public.finance_accounting_exports;
create policy finance_accounting_exports_manage
  on public.finance_accounting_exports for all to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'))
  with check (public.user_has_permission(auth.uid(), 'finance.manage'));

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. RPCs — motor financeiro genérico (security definer)
-- ═══════════════════════════════════════════════════════════════════════════

-- 11.1 Saldo de créditos do próprio utilizador
create or replace function public.finance_my_credit_balance()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_balance numeric(14, 2);
  v_currency text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select balance, currency into v_balance, v_currency
  from public.finance_credit_accounts
  where user_id = v_actor;

  return jsonb_build_object(
    'ok', true,
    'balance', coalesce(v_balance, 0),
    'currency', coalesce(v_currency, 'AOA')
  );
end;
$$;

revoke all on function public.finance_my_credit_balance() from public;
grant execute on function public.finance_my_credit_balance() to authenticated;

-- 11.2 Redimir créditos (o próprio utilizador gasta o seu saldo)
create or replace function public.finance_redeem_credits(
  p_amount numeric,
  p_reason text default null,
  p_order_ref text default null
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
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount required';
  end if;

  select id, balance into v_account_id, v_balance
  from public.finance_credit_accounts
  where user_id = v_actor
  for update;

  if v_account_id is null then
    raise exception 'no credit account';
  end if;
  if coalesce(v_balance, 0) < p_amount then
    raise exception 'insufficient credits';
  end if;

  v_balance := v_balance - p_amount;

  update public.finance_credit_accounts
  set balance = v_balance,
      updated_at = timezone('utc', now())
  where id = v_account_id;

  insert into public.finance_ledger_entries (
    entry_type, status, currency, amount, country_code,
    payer_type, payer_id, payee_type, order_ref, custody_mode, description,
    metadata, created_by, updated_by
  )
  values (
    'credit_redeem', 'captured', 'AOA', p_amount, 'AO',
    'user', v_actor, 'platform', p_order_ref, 'none',
    coalesce(p_reason, 'Uso de Kuteka Credits'),
    jsonb_build_object('reason', p_reason, 'orderRef', p_order_ref), v_actor, v_actor
  )
  returning id into v_ledger_id;

  insert into public.finance_credit_transactions (
    account_id, user_id, direction, amount, balance_after, reason, ledger_entry_id, created_by
  )
  values (
    v_account_id, v_actor, 'redeem', p_amount, v_balance, p_reason, v_ledger_id, v_actor
  )
  returning id into v_tx_id;

  perform public.write_audit_log(
    'finance.credits_redeemed',
    'finance_credit_account',
    v_account_id::text,
    jsonb_build_object('amount', p_amount, 'orderRef', p_order_ref)
  );

  return jsonb_build_object(
    'ok', true,
    'accountId', v_account_id,
    'balance', v_balance,
    'transactionId', v_tx_id,
    'ledgerEntryId', v_ledger_id
  );
end;
$$;

revoke all on function public.finance_redeem_credits(numeric, text, text) from public;
grant execute on function public.finance_redeem_credits(numeric, text, text) to authenticated;

-- 11.3 Criar reembolso
create or replace function public.finance_create_refund(
  p_ledger_entry_id uuid,
  p_amount numeric,
  p_reason text,
  p_mode text default 'credits'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_entry public.finance_ledger_entries%rowtype;
  v_user uuid;
  v_invoice_id uuid;
  v_refund_id uuid;
  v_grant jsonb;
  v_credit_tx uuid;
  v_refund_ledger uuid;
  v_status text := 'pending';
begin
  if v_actor is null or not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'finance.manage required';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount required';
  end if;
  if coalesce(p_mode, 'credits') not in ('credits', 'gateway', 'adjustment') then
    raise exception 'invalid refund mode';
  end if;

  select * into v_entry
  from public.finance_ledger_entries
  where id = p_ledger_entry_id;
  if not found then
    raise exception 'ledger entry not found';
  end if;

  v_user := v_entry.payer_id;
  if v_user is null then
    raise exception 'ledger entry has no payer user';
  end if;

  select id into v_invoice_id
  from public.finance_invoices
  where payment_intent_id = v_entry.payment_intent_id
  limit 1;

  insert into public.finance_refunds (
    ledger_entry_id, payment_intent_id, invoice_id, user_id, amount, currency,
    mode, status, reason, created_by
  )
  values (
    p_ledger_entry_id, v_entry.payment_intent_id, v_invoice_id, v_user, p_amount,
    coalesce(v_entry.currency, 'AOA'), p_mode, 'pending',
    coalesce(nullif(trim(p_reason), ''), 'Reembolso Kuteka'), v_actor
  )
  returning id into v_refund_id;

  if p_mode = 'credits' then
    -- Chama finance_grant_credits directamente: valida finance.manage sobre auth.uid()
    -- (o Super Admin já possui). Sem truques de set_config / jwt.
    v_grant := public.finance_grant_credits(
      v_user, p_amount, coalesce(nullif(trim(p_reason), ''), 'Reembolso em créditos Kuteka')
    );
    v_credit_tx := nullif(v_grant->>'transactionId', '')::uuid;

    insert into public.finance_ledger_entries (
      entry_type, status, currency, amount, country_code,
      payer_type, payer_id, payee_type, payee_id, payment_intent_id,
      custody_mode, description, metadata, created_by, updated_by
    )
    values (
      'refund', 'captured', coalesce(v_entry.currency, 'AOA'), p_amount, 'AO',
      'platform', null, 'user', v_user, v_entry.payment_intent_id,
      'none', 'Reembolso — ' || coalesce(nullif(trim(p_reason), ''), 'créditos'),
      jsonb_build_object('refundId', v_refund_id, 'mode', 'credits'), v_actor, v_actor
    )
    returning id into v_refund_ledger;

    v_status := 'completed';
  elsif p_mode = 'adjustment' then
    insert into public.finance_ledger_entries (
      entry_type, status, currency, amount, country_code,
      payer_type, payer_id, payee_type, payee_id, payment_intent_id,
      custody_mode, description, metadata, created_by, updated_by
    )
    values (
      'adjustment', 'captured', coalesce(v_entry.currency, 'AOA'), p_amount, 'AO',
      'platform', null, 'user', v_user, v_entry.payment_intent_id,
      'none', 'Ajuste de reembolso', jsonb_build_object('refundId', v_refund_id),
      v_actor, v_actor
    )
    returning id into v_refund_ledger;
    v_status := 'completed';
  else
    -- gateway: fica pendente até processamento externo
    v_status := 'pending';
  end if;

  update public.finance_refunds
  set status = v_status,
      credit_transaction_id = v_credit_tx,
      refund_ledger_entry_id = v_refund_ledger,
      resolved_by = case when v_status = 'completed' then v_actor else null end,
      resolved_at = case when v_status = 'completed' then timezone('utc', now()) else null end
  where id = v_refund_id;

  if v_status = 'completed' then
    update public.finance_ledger_entries
    set status = 'refunded', updated_by = v_actor
    where id = p_ledger_entry_id;
  end if;

  perform public.write_audit_log(
    'finance.refund_created',
    'finance_refund',
    v_refund_id::text,
    jsonb_build_object('mode', p_mode, 'amount', p_amount, 'status', v_status)
  );

  return jsonb_build_object(
    'ok', true,
    'refundId', v_refund_id,
    'status', v_status,
    'mode', p_mode,
    'creditTransactionId', v_credit_tx,
    'refundLedgerEntryId', v_refund_ledger
  );
end;
$$;

revoke all on function public.finance_create_refund(uuid, numeric, text, text) from public;
grant execute on function public.finance_create_refund(uuid, numeric, text, text) to authenticated;

-- 11.4 Abrir disputa
create or replace function public.finance_open_dispute(
  p_ledger_entry_id uuid,
  p_reason text,
  p_amount numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_entry public.finance_ledger_entries%rowtype;
  v_user uuid;
  v_amount numeric(14, 2);
  v_dispute_id uuid;
  v_code text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_entry
  from public.finance_ledger_entries
  where id = p_ledger_entry_id;
  if not found then
    raise exception 'ledger entry not found';
  end if;

  if v_entry.payer_id is distinct from v_actor
     and not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'forbidden';
  end if;

  v_user := coalesce(v_entry.payer_id, v_actor);
  v_amount := coalesce(p_amount, v_entry.amount, 0);
  v_code := 'DSP-' || to_char(timezone('utc', now()), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.finance_disputes (
    code, ledger_entry_id, payment_intent_id, user_id, amount, currency,
    status, reason, created_by
  )
  values (
    v_code, p_ledger_entry_id, v_entry.payment_intent_id, v_user, v_amount,
    coalesce(v_entry.currency, 'AOA'), 'open',
    coalesce(nullif(trim(p_reason), ''), 'Disputa aberta'), v_actor
  )
  returning id into v_dispute_id;

  insert into public.finance_ledger_entries (
    entry_type, status, currency, amount, country_code,
    payer_type, payer_id, payee_type, payment_intent_id, custody_mode,
    description, metadata, created_by, updated_by
  )
  values (
    'dispute_hold', 'pending', coalesce(v_entry.currency, 'AOA'), v_amount, 'AO',
    'platform', v_user, 'platform', v_entry.payment_intent_id, 'none',
    'Retenção por disputa ' || v_code,
    jsonb_build_object('disputeId', v_dispute_id), v_actor, v_actor
  );

  update public.finance_ledger_entries
  set status = 'disputed', updated_by = v_actor
  where id = p_ledger_entry_id;

  perform public.write_audit_log(
    'finance.dispute_opened',
    'finance_dispute',
    v_dispute_id::text,
    jsonb_build_object('code', v_code, 'amount', v_amount)
  );

  return jsonb_build_object(
    'ok', true,
    'disputeId', v_dispute_id,
    'code', v_code,
    'status', 'open'
  );
end;
$$;

revoke all on function public.finance_open_dispute(uuid, text, numeric) from public;
grant execute on function public.finance_open_dispute(uuid, text, numeric) to authenticated;

-- 11.5 Correr reconciliação
create or replace function public.finance_run_reconciliation(
  p_period_start date,
  p_period_end date,
  p_gateway_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_run_id uuid;
  v_code text;
  v_matched int := 0;
  v_unmatched int := 0;
  v_total numeric(14, 2) := 0;
  r record;
begin
  if v_actor is null or not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'finance.manage required';
  end if;
  if p_period_start is null or p_period_end is null then
    raise exception 'period required';
  end if;

  v_code := 'REC-' || to_char(timezone('utc', now()), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.finance_reconciliation_runs (
    code, period_start, period_end, gateway_code, status, created_by
  )
  values (v_code, p_period_start, p_period_end, p_gateway_code, 'running', v_actor)
  returning id into v_run_id;

  for r in
    select id, amount, gateway_ref, currency
    from public.finance_ledger_entries
    where entry_type = 'charge'
      and status in ('captured', 'refunded', 'reconciled')
      and created_at >= p_period_start
      and created_at < (p_period_end + 1)
      and (p_gateway_code is null or gateway_code = p_gateway_code)
  loop
    if r.gateway_ref is not null then
      insert into public.finance_reconciliation_items (
        run_id, ledger_entry_id, gateway_ref, expected_amount, gateway_amount, status
      )
      values (v_run_id, r.id, r.gateway_ref, r.amount, r.amount, 'matched');
      v_matched := v_matched + 1;
    else
      insert into public.finance_reconciliation_items (
        run_id, ledger_entry_id, gateway_ref, expected_amount, gateway_amount, status
      )
      values (v_run_id, r.id, null, r.amount, null, 'unmatched');
      v_unmatched := v_unmatched + 1;
    end if;
    v_total := v_total + coalesce(r.amount, 0);
  end loop;

  update public.finance_reconciliation_runs
  set status = 'completed',
      matched_count = v_matched,
      unmatched_count = v_unmatched,
      total_amount = v_total,
      completed_at = timezone('utc', now())
  where id = v_run_id;

  perform public.write_audit_log(
    'finance.reconciliation_run',
    'finance_reconciliation_run',
    v_run_id::text,
    jsonb_build_object('matched', v_matched, 'unmatched', v_unmatched, 'total', v_total)
  );

  return jsonb_build_object(
    'ok', true,
    'runId', v_run_id,
    'code', v_code,
    'matched', v_matched,
    'unmatched', v_unmatched,
    'total', v_total
  );
end;
$$;

revoke all on function public.finance_run_reconciliation(date, date, text) from public;
grant execute on function public.finance_run_reconciliation(date, date, text) to authenticated;

-- 11.6 Gerar HTML da fatura (armazenado em pdf_html)
create or replace function public.finance_generate_invoice_pdf(p_invoice_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_invoice public.finance_invoices%rowtype;
  v_lines_html text := '';
  v_html text;
  v_buyer text;
  v_line jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select * into v_invoice from public.finance_invoices where id = p_invoice_id;
  if not found then
    raise exception 'invoice not found';
  end if;

  if v_invoice.user_id is distinct from v_actor
     and not public.user_has_permission(v_actor, 'finance.read')
     and not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'forbidden';
  end if;

  for v_line in select * from jsonb_array_elements(coalesce(v_invoice.lines, '[]'::jsonb))
  loop
    v_lines_html := v_lines_html ||
      '<tr><td style="padding:6px 0;border-bottom:1px solid #eee">' ||
      coalesce(v_line->>'description', 'Serviço Kuteka') ||
      '</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">' ||
      to_char(coalesce((v_line->>'amount')::numeric, 0), 'FM999G999G990D00') || ' ' ||
      coalesce(v_line->>'currency', v_invoice.currency) || '</td></tr>';
  end loop;

  v_buyer := coalesce(
    v_invoice.buyer_snapshot->>'legalFullName',
    v_invoice.buyer_snapshot->>'displayName',
    v_invoice.buyer_snapshot->>'preferredName',
    'Cliente Kuteka'
  );

  v_html :=
    '<!doctype html><html lang="pt"><head><meta charset="utf-8">' ||
    '<title>Fatura ' || v_invoice.number || '</title></head>' ||
    '<body style="font-family:system-ui,Arial,sans-serif;color:#0f172a;max-width:640px;margin:24px auto;padding:0 16px">' ||
    '<header style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:12px">' ||
    '<div><h1 style="margin:0;font-size:20px">Kuteka</h1>' ||
    '<p style="margin:2px 0;color:#64748b;font-size:12px">Infraestrutura financeira · custódia none</p></div>' ||
    '<div style="text-align:right"><p style="margin:0;font-weight:600">Fatura ' || v_invoice.number || '</p>' ||
    '<p style="margin:2px 0;color:#64748b;font-size:12px">' ||
    to_char(coalesce(v_invoice.issued_at, v_invoice.created_at), 'YYYY-MM-DD') || '</p>' ||
    '<p style="margin:2px 0;color:#64748b;font-size:12px">Estado: ' || v_invoice.status || '</p></div></header>' ||
    '<section style="margin-top:16px"><p style="margin:0;color:#64748b;font-size:12px">Faturar a</p>' ||
    '<p style="margin:2px 0;font-weight:600">' || v_buyer || '</p></section>' ||
    '<table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px">' ||
    '<thead><tr><th style="text-align:left;padding:6px 0;border-bottom:2px solid #0f172a">Descrição</th>' ||
    '<th style="text-align:right;padding:6px 0;border-bottom:2px solid #0f172a">Montante</th></tr></thead>' ||
    '<tbody>' || v_lines_html || '</tbody>' ||
    '<tfoot><tr><td style="padding:8px 0;text-align:right;font-weight:600">Total</td>' ||
    '<td style="padding:8px 0;text-align:right;font-weight:700">' ||
    to_char(coalesce(v_invoice.total, 0), 'FM999G999G990D00') || ' ' || v_invoice.currency ||
    '</td></tr></tfoot></table>' ||
    '<footer style="margin-top:24px;color:#94a3b8;font-size:11px">Documento gerado por Kuteka. ' ||
    'Sem valor fiscal até integração AGT/SAF-T.</footer></body></html>';

  update public.finance_invoices
  set pdf_html = v_html,
      pdf_generated_at = timezone('utc', now())
  where id = p_invoice_id;

  return jsonb_build_object(
    'ok', true,
    'invoiceId', p_invoice_id,
    'number', v_invoice.number,
    'html', v_html
  );
end;
$$;

revoke all on function public.finance_generate_invoice_pdf(uuid) from public;
grant execute on function public.finance_generate_invoice_pdf(uuid) to authenticated;

-- 11.7 Marcar fatura como enviada por email
create or replace function public.finance_mark_invoice_emailed(
  p_invoice_id uuid,
  p_email text
)
returns jsonb
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

  update public.finance_invoices
  set email_sent_at = timezone('utc', now()),
      email_to = p_email
  where id = p_invoice_id;

  if not found then
    raise exception 'invoice not found';
  end if;

  perform public.write_audit_log(
    'finance.invoice_emailed',
    'finance_invoice',
    p_invoice_id::text,
    jsonb_build_object('email', p_email)
  );

  return jsonb_build_object('ok', true, 'invoiceId', p_invoice_id, 'email', p_email);
end;
$$;

revoke all on function public.finance_mark_invoice_emailed(uuid, text) from public;
grant execute on function public.finance_mark_invoice_emailed(uuid, text) to authenticated;

-- 11.8 Upsert de produto (config-first)
create or replace function public.finance_upsert_product(
  p_code text,
  p_name text,
  p_category text,
  p_pricing_model text,
  p_description text default null,
  p_currency text default 'AOA',
  p_buyer_roles text[] default '{}',
  p_kai_suggestible boolean default false,
  p_active boolean default true,
  p_amount numeric default null,
  p_price_code text default null,
  p_charge_event text default 'on_purchase'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_product_id uuid;
begin
  if v_actor is null or not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'finance.manage required';
  end if;
  if p_code is null or length(trim(p_code)) < 2 then
    raise exception 'code required';
  end if;

  insert into public.finance_products (
    code, name, description, category, pricing_model, buyer_roles,
    currency, kai_suggestible, active, created_by, updated_by
  )
  values (
    trim(p_code), p_name, p_description, p_category, p_pricing_model,
    coalesce(p_buyer_roles, '{}'), coalesce(p_currency, 'AOA'),
    coalesce(p_kai_suggestible, false), coalesce(p_active, true), v_actor, v_actor
  )
  on conflict (code) do update
  set name = excluded.name,
      description = excluded.description,
      category = excluded.category,
      pricing_model = excluded.pricing_model,
      buyer_roles = excluded.buyer_roles,
      currency = excluded.currency,
      kai_suggestible = excluded.kai_suggestible,
      active = excluded.active,
      updated_by = v_actor,
      updated_at = timezone('utc', now()),
      deleted_at = null
  returning id into v_product_id;

  if p_amount is not null then
    insert into public.finance_price_rules (
      product_id, code, label, amount, currency, charge_event, priority, created_by, updated_by
    )
    values (
      v_product_id, coalesce(nullif(trim(p_price_code), ''), 'default'),
      coalesce(p_name, p_code) || ' — preço', p_amount, coalesce(p_currency, 'AOA'),
      coalesce(nullif(trim(p_charge_event), ''), 'on_purchase'), 10, v_actor, v_actor
    )
    on conflict (product_id, code) do update
    set amount = excluded.amount,
        charge_event = excluded.charge_event,
        active = true,
        updated_by = v_actor,
        updated_at = timezone('utc', now()),
        deleted_at = null;
  end if;

  perform public.write_audit_log(
    'finance.product_upserted',
    'finance_product',
    v_product_id::text,
    jsonb_build_object('code', p_code)
  );

  return jsonb_build_object('ok', true, 'productId', v_product_id, 'code', p_code);
end;
$$;

revoke all on function public.finance_upsert_product(text, text, text, text, text, text, text[], boolean, boolean, numeric, text, text) from public;
grant execute on function public.finance_upsert_product(text, text, text, text, text, text, text[], boolean, boolean, numeric, text, text) to authenticated;

-- 11.9 Definir comissão
create or replace function public.finance_set_commission(
  p_code text,
  p_label text,
  p_category text,
  p_take_rate_pct numeric default null,
  p_fixed_amount numeric default null,
  p_payer_side text default 'provider',
  p_currency text default 'AOA',
  p_active boolean default true
)
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

  insert into public.finance_commission_rules (
    code, label, category, take_rate_pct, fixed_amount, currency, payer_side, active,
    created_by, updated_by
  )
  values (
    trim(p_code), p_label, p_category, p_take_rate_pct, p_fixed_amount,
    coalesce(p_currency, 'AOA'), coalesce(p_payer_side, 'provider'),
    coalesce(p_active, true), v_actor, v_actor
  )
  on conflict (code) do update
  set label = excluded.label,
      category = excluded.category,
      take_rate_pct = excluded.take_rate_pct,
      fixed_amount = excluded.fixed_amount,
      currency = excluded.currency,
      payer_side = excluded.payer_side,
      active = excluded.active,
      updated_by = v_actor,
      updated_at = timezone('utc', now()),
      deleted_at = null
  returning id into v_id;

  perform public.write_audit_log(
    'finance.commission_set',
    'finance_commission_rule',
    v_id::text,
    jsonb_build_object('code', p_code, 'takeRate', p_take_rate_pct)
  );

  return jsonb_build_object('ok', true, 'commissionId', v_id, 'code', p_code);
end;
$$;

revoke all on function public.finance_set_commission(text, text, text, numeric, numeric, text, text, boolean) from public;
grant execute on function public.finance_set_commission(text, text, text, numeric, numeric, text, text, boolean) to authenticated;

-- 11.10 Upsert de regra KAI
create or replace function public.finance_upsert_kai_rule(
  p_code text,
  p_label text,
  p_trigger_event text,
  p_target_product_code text default null,
  p_description text default null,
  p_target_segment text default null,
  p_consent_scope text default null,
  p_priority int default 100,
  p_active boolean default true,
  p_config jsonb default '{}'::jsonb
)
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

  insert into public.finance_kai_rules (
    code, label, description, trigger_event, target_product_code, target_segment,
    consent_scope, priority, active, config, created_by, updated_by
  )
  values (
    trim(p_code), p_label, p_description, p_trigger_event, p_target_product_code,
    p_target_segment, p_consent_scope, coalesce(p_priority, 100),
    coalesce(p_active, true), coalesce(p_config, '{}'::jsonb), v_actor, v_actor
  )
  on conflict (code) do update
  set label = excluded.label,
      description = excluded.description,
      trigger_event = excluded.trigger_event,
      target_product_code = excluded.target_product_code,
      target_segment = excluded.target_segment,
      consent_scope = excluded.consent_scope,
      priority = excluded.priority,
      active = excluded.active,
      config = excluded.config,
      updated_by = v_actor,
      updated_at = timezone('utc', now()),
      deleted_at = null
  returning id into v_id;

  perform public.write_audit_log(
    'finance.kai_rule_upserted',
    'finance_kai_rule',
    v_id::text,
    jsonb_build_object('code', p_code, 'trigger', p_trigger_event)
  );

  return jsonb_build_object('ok', true, 'kaiRuleId', v_id, 'code', p_code);
end;
$$;

revoke all on function public.finance_upsert_kai_rule(text, text, text, text, text, text, text, int, boolean, jsonb) from public;
grant execute on function public.finance_upsert_kai_rule(text, text, text, text, text, text, text, int, boolean, jsonb) to authenticated;

-- 11.11 Sinalizar fraude
create or replace function public.finance_flag_fraud(
  p_entity_type text,
  p_entity_id uuid,
  p_reason text,
  p_severity text default 'medium',
  p_user_id uuid default null,
  p_signals jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_code text;
begin
  if v_actor is null or not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'finance.manage required';
  end if;

  v_code := 'FRD-' || to_char(timezone('utc', now()), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.finance_fraud_flags (
    code, entity_type, entity_id, user_id, severity, status, reason, signals, created_by
  )
  values (
    v_code, p_entity_type, p_entity_id, p_user_id, coalesce(p_severity, 'medium'),
    'open', coalesce(nullif(trim(p_reason), ''), 'Sinal de fraude'),
    coalesce(p_signals, '{}'::jsonb), v_actor
  )
  returning id into v_id;

  perform public.write_audit_log(
    'finance.fraud_flagged',
    'finance_fraud_flag',
    v_id::text,
    jsonb_build_object('code', v_code, 'severity', p_severity)
  );

  return jsonb_build_object('ok', true, 'flagId', v_id, 'code', v_code);
end;
$$;

revoke all on function public.finance_flag_fraud(text, uuid, text, text, uuid, jsonb) from public;
grant execute on function public.finance_flag_fraud(text, uuid, text, text, uuid, jsonb) to authenticated;

-- 11.12 Resolver sinal de fraude
create or replace function public.finance_resolve_fraud(
  p_flag_id uuid,
  p_status text,
  p_notes text default null
)
returns jsonb
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
  if coalesce(p_status, '') not in ('reviewing', 'confirmed', 'dismissed', 'open') then
    raise exception 'invalid status';
  end if;

  update public.finance_fraud_flags
  set status = p_status,
      resolved_at = case when p_status in ('confirmed', 'dismissed') then timezone('utc', now()) else null end,
      resolved_by = case when p_status in ('confirmed', 'dismissed') then v_actor else null end,
      metadata = metadata || jsonb_build_object('notes', p_notes)
  where id = p_flag_id;

  if not found then
    raise exception 'flag not found';
  end if;

  perform public.write_audit_log(
    'finance.fraud_resolved',
    'finance_fraud_flag',
    p_flag_id::text,
    jsonb_build_object('status', p_status)
  );

  return jsonb_build_object('ok', true, 'flagId', p_flag_id, 'status', p_status);
end;
$$;

revoke all on function public.finance_resolve_fraud(uuid, text, text) from public;
grant execute on function public.finance_resolve_fraud(uuid, text, text) to authenticated;

-- 11.13 Upsert de conta CRM
create or replace function public.finance_upsert_crm_account(
  p_code text,
  p_name text,
  p_account_type text,
  p_service_provider_id uuid default null,
  p_user_id uuid default null,
  p_contact_email text default null,
  p_contact_phone text default null,
  p_status text default 'active',
  p_metadata jsonb default '{}'::jsonb
)
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

  insert into public.finance_crm_accounts (
    code, name, account_type, service_provider_id, user_id, contact_email,
    contact_phone, status, owner_user_id, metadata, created_by, updated_by
  )
  values (
    trim(p_code), p_name, p_account_type, p_service_provider_id, p_user_id,
    p_contact_email, p_contact_phone, coalesce(p_status, 'active'), v_actor,
    coalesce(p_metadata, '{}'::jsonb), v_actor, v_actor
  )
  on conflict (code) do update
  set name = excluded.name,
      account_type = excluded.account_type,
      service_provider_id = excluded.service_provider_id,
      user_id = excluded.user_id,
      contact_email = excluded.contact_email,
      contact_phone = excluded.contact_phone,
      status = excluded.status,
      metadata = excluded.metadata,
      updated_by = v_actor,
      updated_at = timezone('utc', now()),
      deleted_at = null
  returning id into v_id;

  perform public.write_audit_log(
    'finance.crm_account_upserted',
    'finance_crm_account',
    v_id::text,
    jsonb_build_object('code', p_code, 'type', p_account_type)
  );

  return jsonb_build_object('ok', true, 'crmAccountId', v_id, 'code', p_code);
end;
$$;

revoke all on function public.finance_upsert_crm_account(text, text, text, uuid, uuid, text, text, text, jsonb) from public;
grant execute on function public.finance_upsert_crm_account(text, text, text, uuid, uuid, text, text, text, jsonb) to authenticated;

-- 11.14 Criar exportação contabilística
create or replace function public.finance_create_accounting_export(
  p_period_start date,
  p_period_end date,
  p_format text default 'csv'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_code text;
  v_content text := '';
  v_rows int := 0;
  v_total numeric(14, 2) := 0;
  r record;
begin
  if v_actor is null or not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'finance.manage required';
  end if;
  if coalesce(p_format, 'csv') not in ('csv', 'json', 'xml', 'saft') then
    raise exception 'invalid format';
  end if;

  v_code := 'EXP-' || to_char(timezone('utc', now()), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  if p_format = 'json' then
    select
      coalesce(jsonb_agg(jsonb_build_object(
        'id', e.id, 'type', e.entry_type, 'status', e.status,
        'amount', e.amount, 'currency', e.currency, 'createdAt', e.created_at
      )), '[]'::jsonb)::text,
      count(*),
      coalesce(sum(e.amount), 0)
    into v_content, v_rows, v_total
    from public.finance_ledger_entries e
    where e.created_at >= p_period_start and e.created_at < (p_period_end + 1);
  else
    v_content := 'id,entry_type,status,amount,currency,created_at' || E'\n';
    for r in
      select id, entry_type, status, amount, currency, created_at
      from public.finance_ledger_entries
      where created_at >= p_period_start and created_at < (p_period_end + 1)
      order by created_at
    loop
      v_content := v_content || r.id || ',' || r.entry_type || ',' || r.status || ',' ||
        to_char(coalesce(r.amount, 0), 'FM999999990.00') || ',' || r.currency || ',' ||
        to_char(r.created_at, 'YYYY-MM-DD"T"HH24:MI:SS') || E'\n';
      v_rows := v_rows + 1;
      v_total := v_total + coalesce(r.amount, 0);
    end loop;
  end if;

  insert into public.finance_accounting_exports (
    code, period_start, period_end, format, status, content, row_count,
    total_amount, generated_at, created_by
  )
  values (
    v_code, p_period_start, p_period_end, coalesce(p_format, 'csv'), 'generated',
    v_content, v_rows, v_total, timezone('utc', now()), v_actor
  )
  returning id into v_id;

  perform public.write_audit_log(
    'finance.accounting_export',
    'finance_accounting_export',
    v_id::text,
    jsonb_build_object('code', v_code, 'rows', v_rows, 'format', p_format)
  );

  return jsonb_build_object(
    'ok', true,
    'exportId', v_id,
    'code', v_code,
    'rowCount', v_rows,
    'total', v_total,
    'format', coalesce(p_format, 'csv'),
    'content', v_content
  );
end;
$$;

revoke all on function public.finance_create_accounting_export(date, date, text) from public;
grant execute on function public.finance_create_accounting_export(date, date, text) to authenticated;

-- 11.15 Snapshot de receita (substitui versão da Fase 1)
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
    'refunds', (
      select coalesce(sum(amount), 0) from public.finance_refunds
      where status = 'completed'
    ),
    'openDisputes', (
      select count(*) from public.finance_disputes
      where status in ('open', 'investigating')
    ),
    'openFraud', (
      select count(*) from public.finance_fraud_flags
      where status in ('open', 'reviewing')
    ),
    'crmAccounts', (
      select count(*) from public.finance_crm_accounts where deleted_at is null
    ),
    'kaiRules', (
      select count(*) from public.finance_kai_rules
      where deleted_at is null and active
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

-- ═══════════════════════════════════════════════════════════════════════════
-- 12. Seeds — catálogo transversal, regras KAI, CRM e sequência de faturas
-- ═══════════════════════════════════════════════════════════════════════════

-- 12.1 Sequência de faturação AO para o ano corrente
insert into public.finance_invoice_sequences (country_code, year, last_number, prefix)
values ('AO', extract(year from timezone('utc', now()))::int, 0, 'KT')
on conflict (country_code, year) do nothing;

-- 12.2 Produtos transversais + regras de preço
do $$
declare
  v_id uuid;
begin
  insert into public.finance_products (
    code, name, description, category, pricing_model, buyer_roles,
    country_code, currency, kai_suggestible, active
  ) values
    ('concierge.request', 'Concierge Kuteka',
     'Pedido assistido de serviços à medida.', 'other', 'fixed',
     array['client'], 'AO', 'AOA', true, true),
    ('garantia.monthly', 'Garantia Kuteka (mensal)',
     'Cobertura mensal de garantia para o arrendamento.', 'protection', 'subscription',
     array['client', 'patrimonial_partner'], 'AO', 'AOA', true, true),
    ('assistencia_24h.call', 'Assistência 24h',
     'Chamada de assistência urgente ao domicílio.', 'protection', 'fixed',
     array['client'], 'AO', 'AOA', true, true),
    ('avaliacao.imovel', 'Avaliação de imóvel',
     'Relatório de avaliação profissional do imóvel.', 'other', 'fixed',
     array['client', 'patrimonial_partner'], 'AO', 'AOA', true, true),
    ('reserva.visita', 'Reserva de visita',
     'Reserva prioritária de visita a imóvel.', 'mobility', 'fixed',
     array['client'], 'AO', 'AOA', true, true),
    ('destaque.listing', 'Destaque de anúncio',
     'Promove um anúncio no topo do explore.', 'advertising', 'fixed',
     array['patrimonial_partner'], 'AO', 'AOA', true, true),
    ('partner.platinum.monthly', 'Plano Parceiro Platinum',
     'Nível máximo — gestão total, KAI comercial e prioridade absoluta.', 'partner_plan', 'subscription',
     array['patrimonial_partner'], 'AO', 'AOA', true, true)
  on conflict (code) do update
  set name = excluded.name,
      description = excluded.description,
      category = excluded.category,
      pricing_model = excluded.pricing_model,
      active = true;

  select id into v_id from public.finance_products where code = 'concierge.request';
  insert into public.finance_price_rules (product_id, code, label, amount, currency, charge_event, priority)
  values (v_id, 'concierge_default', 'Concierge — pedido', 7500, 'AOA', 'on_purchase', 10)
  on conflict (product_id, code) do update set amount = excluded.amount, active = true;

  select id into v_id from public.finance_products where code = 'garantia.monthly';
  insert into public.finance_price_rules (product_id, code, label, amount, currency, charge_event, priority)
  values (v_id, 'garantia_monthly', 'Garantia mensal', 4000, 'AOA', 'subscription_cycle', 10)
  on conflict (product_id, code) do update set amount = excluded.amount, active = true;

  select id into v_id from public.finance_products where code = 'assistencia_24h.call';
  insert into public.finance_price_rules (product_id, code, label, amount, currency, charge_event, priority)
  values (v_id, 'assistencia_call', 'Assistência 24h — chamada', 6000, 'AOA', 'on_purchase', 10)
  on conflict (product_id, code) do update set amount = excluded.amount, active = true;

  select id into v_id from public.finance_products where code = 'avaliacao.imovel';
  insert into public.finance_price_rules (product_id, code, label, amount, currency, charge_event, priority)
  values (v_id, 'avaliacao_default', 'Avaliação de imóvel', 12000, 'AOA', 'on_purchase', 10)
  on conflict (product_id, code) do update set amount = excluded.amount, active = true;

  select id into v_id from public.finance_products where code = 'reserva.visita';
  insert into public.finance_price_rules (product_id, code, label, amount, currency, charge_event, priority)
  values (v_id, 'reserva_default', 'Reserva de visita', 2000, 'AOA', 'on_purchase', 10)
  on conflict (product_id, code) do update set amount = excluded.amount, active = true;

  select id into v_id from public.finance_products where code = 'destaque.listing';
  insert into public.finance_price_rules (product_id, code, label, amount, currency, charge_event, priority)
  values (v_id, 'destaque_default', 'Destaque de anúncio (7 dias)', 8000, 'AOA', 'on_purchase', 10)
  on conflict (product_id, code) do update set amount = excluded.amount, active = true;

  select id into v_id from public.finance_products where code = 'partner.platinum.monthly';
  insert into public.finance_price_rules (product_id, code, label, amount, currency, charge_event, priority)
  values (v_id, 'platinum_monthly', 'Platinum mensal', 90000, 'AOA', 'subscription_cycle', 10)
  on conflict (product_id, code) do update set amount = excluded.amount, active = true;
end $$;

-- 12.3 Regras KAI base
insert into public.finance_kai_rules (
  code, label, description, trigger_event, target_product_code, target_segment,
  consent_scope, priority, active
) values
  ('exit_intent_smart_move', 'Saída detectada → Mudança Inteligente',
   'Quando o cliente sinaliza intenção de saída, sugere abrir Mudança Inteligente.',
   'exit_intent', 'smart_move.open', 'client', 'kai_suggestions', 10, true),
  ('maintenance_marketplace', 'Manutenção → Marketplace',
   'Ao registar pedido de manutenção, sugere prestadores do marketplace.',
   'maintenance_request', null, 'client', 'provider_offers', 20, true),
  ('partner_upgrade', 'Parceiro → Upgrade de plano',
   'Parceiro com bom desempenho recebe sugestão de upgrade de plano.',
   'partner_dashboard', 'partner.platinum.monthly', 'patrimonial_partner', 'partner_offers', 30, true)
on conflict (code) do update
set label = excluded.label,
    description = excluded.description,
    trigger_event = excluded.trigger_event,
    target_product_code = excluded.target_product_code,
    active = true;

-- 12.4 Contas CRM a partir dos prestadores existentes
insert into public.finance_crm_accounts (
  code, name, account_type, service_provider_id, contact_phone, country_code, status, metadata
)
select
  'provider:' || sp.id::text,
  sp.business_name,
  'provider',
  sp.id,
  sp.phone,
  'AO',
  case when sp.active then 'active' else 'prospect' end,
  jsonb_build_object('category', sp.category, 'isDemo', sp.is_demo)
from public.service_providers sp
where sp.deleted_at is null
on conflict (code) do update
set name = excluded.name,
    contact_phone = excluded.contact_phone,
    status = excluded.status,
    metadata = excluded.metadata;

comment on table public.finance_refunds is
  'ADR-017: Reembolsos genéricos (créditos / gateway / ajuste). Fase A custody=none.';
comment on table public.finance_disputes is
  'ADR-017: Disputas / chargebacks — infraestrutura transversal.';
comment on table public.finance_reconciliation_runs is
  'ADR-017: Reconciliação ledger ↔ gateways (sandbox até integração real).';
comment on table public.finance_kai_rules is
  'ADR-017: Motor de regras KAI para sugestões comerciais (opt-in por consentimento).';
comment on table public.finance_crm_accounts is
  'ADR-017: CRM financeiro — parceiros, prestadores, empresas e investidores.';
comment on table public.finance_accounting_exports is
  'ADR-017: Exportações contabilísticas (CSV/JSON, base para SAF-T/AGT).';
