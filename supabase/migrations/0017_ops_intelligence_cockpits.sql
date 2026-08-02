-- Operational intelligence — contract lifecycle, payments, exit intent,
-- future availability, maintenance requests, service provider stub, KAI seed.

-- ─── Contract lifecycle columns ─────────────────────────────────────────────
alter table public.property_contracts
  add column if not exists starts_on date,
  add column if not exists ends_on date,
  add column if not exists billing_day smallint
    check (billing_day is null or (billing_day >= 1 and billing_day <= 28)),
  add column if not exists deposit_aoa numeric(14, 2)
    check (deposit_aoa is null or deposit_aoa >= 0),
  add column if not exists next_payment_due date,
  add column if not exists next_payment_amount_aoa numeric(14, 2)
    check (next_payment_amount_aoa is null or next_payment_amount_aoa >= 0),
  add column if not exists exit_intent text not null default 'none'
    check (exit_intent in ('none', 'considering', 'confirmed')),
  add column if not exists exit_intent_date date,
  add column if not exists exit_reason text,
  add column if not exists exit_notes text;

comment on column public.property_contracts.exit_intent is
  'Client early-exit signal — feeds future availability & partner pipeline.';

-- ─── Future availability on properties ──────────────────────────────────────
alter table public.properties
  add column if not exists expected_available_on date,
  add column if not exists availability_note text;

create index if not exists properties_expected_available_on_idx
  on public.properties (expected_available_on)
  where deleted_at is null and expected_available_on is not null;

-- ─── Contract payments ──────────────────────────────────────────────────────
create table if not exists public.contract_payments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.property_contracts (id),
  due_on date not null,
  amount_aoa numeric(14, 2) not null check (amount_aoa > 0),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'late', 'waived', 'cancelled')),
  paid_at timestamptz,
  late_days integer not null default 0 check (late_days >= 0),
  penalty_aoa numeric(14, 2) not null default 0 check (penalty_aoa >= 0),
  notes text,
  is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id)
);

create index if not exists contract_payments_contract_id_idx
  on public.contract_payments (contract_id);
create index if not exists contract_payments_due_on_idx
  on public.contract_payments (due_on);
create index if not exists contract_payments_status_idx
  on public.contract_payments (status);

drop trigger if exists contract_payments_set_updated_at on public.contract_payments;
create trigger contract_payments_set_updated_at
before update on public.contract_payments
for each row execute function public.set_updated_at();

alter table public.contract_payments enable row level security;

drop policy if exists contract_payments_select_related on public.contract_payments;
create policy contract_payments_select_related
  on public.contract_payments for select to authenticated
  using (
    exists (
      select 1 from public.property_contracts c
      where c.id = contract_id
        and c.deleted_at is null
        and (
          c.client_id = auth.uid()
          or c.partner_id = auth.uid()
          or c.agent_id = auth.uid()
          or public.user_has_permission(auth.uid(), 'admin.panel')
        )
    )
  );

drop policy if exists contract_payments_write_related on public.contract_payments;
create policy contract_payments_write_related
  on public.contract_payments for insert to authenticated
  with check (
    exists (
      select 1 from public.property_contracts c
      where c.id = contract_id
        and c.deleted_at is null
        and (
          c.partner_id = auth.uid()
          or public.user_has_permission(auth.uid(), 'admin.panel')
        )
    )
  );

drop policy if exists contract_payments_update_related on public.contract_payments;
create policy contract_payments_update_related
  on public.contract_payments for update to authenticated
  using (
    exists (
      select 1 from public.property_contracts c
      where c.id = contract_id
        and c.deleted_at is null
        and (
          c.partner_id = auth.uid()
          or c.client_id = auth.uid()
          or public.user_has_permission(auth.uid(), 'admin.panel')
        )
    )
  );

-- ─── Maintenance / service requests (client → partner / network) ────────────
create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id),
  contract_id uuid references public.property_contracts (id),
  client_id uuid not null references public.profiles (id),
  partner_id uuid references public.profiles (id),
  category text not null
    check (category in (
      'maintenance', 'cleaning', 'renovation', 'painting',
      'electricity', 'plumbing', 'gardening', 'security', 'other'
    )),
  title text not null,
  description text,
  status text not null default 'requested'
    check (status in ('requested', 'scheduled', 'in_progress', 'done', 'cancelled')),
  scheduled_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id)
);

create index if not exists maintenance_requests_client_id_idx
  on public.maintenance_requests (client_id);
create index if not exists maintenance_requests_property_id_idx
  on public.maintenance_requests (property_id);
create index if not exists maintenance_requests_status_idx
  on public.maintenance_requests (status);

drop trigger if exists maintenance_requests_set_updated_at on public.maintenance_requests;
create trigger maintenance_requests_set_updated_at
before update on public.maintenance_requests
for each row execute function public.set_updated_at();

alter table public.maintenance_requests enable row level security;

drop policy if exists maintenance_requests_select on public.maintenance_requests;
create policy maintenance_requests_select
  on public.maintenance_requests for select to authenticated
  using (
    client_id = auth.uid()
    or partner_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'admin.panel')
    or public.user_has_permission(auth.uid(), 'properties.manage')
  );

drop policy if exists maintenance_requests_insert_client on public.maintenance_requests;
create policy maintenance_requests_insert_client
  on public.maintenance_requests for insert to authenticated
  with check (client_id = auth.uid());

drop policy if exists maintenance_requests_update_parties on public.maintenance_requests;
create policy maintenance_requests_update_parties
  on public.maintenance_requests for update to authenticated
  using (
    client_id = auth.uid()
    or partner_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'admin.panel')
  );

-- ─── Notify when property becomes available ─────────────────────────────────
create table if not exists public.availability_notify_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id),
  property_id uuid not null references public.properties (id),
  status text not null default 'open'
    check (status in ('open', 'notified', 'closed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (client_id, property_id)
);

create index if not exists availability_notify_property_idx
  on public.availability_notify_requests (property_id)
  where status = 'open';

alter table public.availability_notify_requests enable row level security;

drop policy if exists availability_notify_select on public.availability_notify_requests;
create policy availability_notify_select
  on public.availability_notify_requests for select to authenticated
  using (
    client_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'properties.manage')
    or public.user_has_permission(auth.uid(), 'admin.panel')
  );

drop policy if exists availability_notify_insert on public.availability_notify_requests;
create policy availability_notify_insert
  on public.availability_notify_requests for insert to authenticated
  with check (client_id = auth.uid());

drop policy if exists availability_notify_update on public.availability_notify_requests;
create policy availability_notify_update
  on public.availability_notify_requests for update to authenticated
  using (
    client_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'admin.panel')
  );

-- ─── Service provider role stub ─────────────────────────────────────────────
insert into public.roles (code, name, description, is_system)
values (
  'service_provider',
  'Prestador de Serviços',
  'Rede de prestadores Kuteka — pintura, limpeza, remodelação, etc.',
  false
)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  updated_at = timezone('utc', now());

insert into public.permissions (code, description)
values (
  'services.operate',
  'Agenda, pedidos e faturação do prestador de serviços'
)
on conflict (code) do update
set description = excluded.description,
    updated_at = timezone('utc', now());

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'service_provider'
  and p.code in ('platform.access', 'services.operate')
on conflict do nothing;

-- ─── Sync expected_available_on from exit intent / ends_on ──────────────────
create or replace function public.sync_property_expected_availability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date;
begin
  if NEW.property_id is null then
    return NEW;
  end if;

  v_date := coalesce(NEW.exit_intent_date, NEW.ends_on);

  if NEW.exit_intent in ('considering', 'confirmed') and v_date is not null then
    update public.properties
    set expected_available_on = v_date,
        availability_note = case
          when NEW.exit_intent = 'confirmed' then 'Saída confirmada pelo cliente'
          else 'Intenção de saída registada'
        end,
        updated_at = timezone('utc', now())
    where id = NEW.property_id
      and deleted_at is null;
  elsif NEW.status = 'active' and NEW.ends_on is not null then
    update public.properties
    set expected_available_on = NEW.ends_on,
        availability_note = coalesce(availability_note, 'Fim de contrato previsto'),
        updated_at = timezone('utc', now())
    where id = NEW.property_id
      and deleted_at is null
      and (expected_available_on is null or expected_available_on > NEW.ends_on);
  end if;

  return NEW;
end;
$$;

drop trigger if exists property_contracts_sync_availability on public.property_contracts;
create trigger property_contracts_sync_availability
after insert or update of ends_on, exit_intent, exit_intent_date, status
on public.property_contracts
for each row execute function public.sync_property_expected_availability();

-- ─── Seed operational demo data on existing demo contracts ──────────────────
create or replace function public.seed_ops_intelligence_demo()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_pay uuid;
  v_i int;
begin
  for r in
    select c.*
    from public.property_contracts c
    where c.is_demo = true
      and c.deleted_at is null
      and c.status in ('active', 'completed')
  loop
    update public.property_contracts
    set
      starts_on = coalesce(starts_on, (timezone('utc', now()) - interval '8 months')::date),
      ends_on = coalesce(ends_on, (timezone('utc', now()) + interval '45 days')::date),
      billing_day = coalesce(billing_day, 5),
      deposit_aoa = coalesce(deposit_aoa, round(amount_aoa, 2)),
      next_payment_due = coalesce(
        next_payment_due,
        date_trunc('month', timezone('utc', now()))::date + 4
      ),
      next_payment_amount_aoa = coalesce(next_payment_amount_aoa, round(amount_aoa / 12.0, 2)),
      updated_at = timezone('utc', now())
    where id = r.id;

    -- payments history (last 3 months + next)
    if not exists (select 1 from public.contract_payments p where p.contract_id = r.id) then
      for v_i in 0..3 loop
        insert into public.contract_payments (
          contract_id, due_on, amount_aoa, status, paid_at, late_days, is_demo, created_by, updated_by
        ) values (
          r.id,
          (date_trunc('month', timezone('utc', now()))::date - ((3 - v_i) * interval '1 month') + interval '4 days')::date,
          round(r.amount_aoa / 12.0, 2),
          case when v_i < 3 then 'paid' else 'pending' end,
          case when v_i < 3 then timezone('utc', now()) - ((3 - v_i) * interval '1 month') else null end,
          0,
          true,
          r.partner_id,
          r.partner_id
        );
      end loop;
    end if;

    update public.properties
    set expected_available_on = coalesce(
          expected_available_on,
          (timezone('utc', now()) + interval '45 days')::date
        ),
        availability_note = coalesce(availability_note, 'Disponibilidade futura prevista (demo)'),
        updated_at = timezone('utc', now())
    where id = r.property_id
      and deleted_at is null;
  end loop;

  -- one demo exit intent on an active rent contract if client exists
  update public.property_contracts c
  set exit_intent = 'considering',
      exit_intent_date = (timezone('utc', now()) + interval '45 days')::date,
      exit_reason = 'mudanca_cidade',
      exit_notes = 'Demo: cliente considera sair em ~45 dias.',
      updated_at = timezone('utc', now())
  where c.is_demo = true
    and c.status = 'active'
    and c.purpose = 'rent'
    and c.deleted_at is null
    and c.exit_intent = 'none'
    and c.id = (
      select id from public.property_contracts
      where is_demo = true and status = 'active' and purpose = 'rent' and deleted_at is null
      order by created_at
      limit 1
    );

  -- sample maintenance request
  select id into v_pay from public.property_contracts
  where is_demo = true and status = 'active' and deleted_at is null
  order by created_at limit 1;

  if v_pay is not null then
    insert into public.maintenance_requests (
      property_id, contract_id, client_id, partner_id, category, title, description, status, is_demo, created_by, updated_by
    )
    select
      c.property_id, c.id, c.client_id, c.partner_id,
      'plumbing', 'Canalização — torneira a pingar',
      'Pedido demo do cockpit do cliente.',
      'requested', true, c.client_id, c.client_id
    from public.property_contracts c
    where c.id = v_pay
      and not exists (
        select 1 from public.maintenance_requests m
        where m.contract_id = c.id and m.is_demo = true
      );
  end if;
end;
$$;

revoke all on function public.seed_ops_intelligence_demo() from public;
grant execute on function public.seed_ops_intelligence_demo() to authenticated, service_role;

-- Client can register exit intent on own contracts (no broad UPDATE grant)
create or replace function public.set_contract_exit_intent(
  p_contract_id uuid,
  p_exit_intent text,
  p_exit_intent_date date,
  p_exit_reason text default null,
  p_exit_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'not authenticated';
  end if;
  if p_exit_intent not in ('none', 'considering', 'confirmed') then
    raise exception 'invalid exit_intent';
  end if;

  update public.property_contracts
  set
    exit_intent = p_exit_intent,
    exit_intent_date = p_exit_intent_date,
    exit_reason = p_exit_reason,
    exit_notes = p_exit_notes,
    updated_by = v_actor,
    updated_at = timezone('utc', now())
  where id = p_contract_id
    and deleted_at is null
    and client_id = v_actor
    and status = 'active';

  if not found then
    raise exception 'contract not found or not allowed';
  end if;
end;
$$;

revoke all on function public.set_contract_exit_intent(uuid, text, date, text, text) from public;
grant execute on function public.set_contract_exit_intent(uuid, text, date, text, text)
  to authenticated, service_role;

create or replace function public.request_availability_notify(p_property_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  if v_actor is null then
    raise exception 'not authenticated';
  end if;

  insert into public.availability_notify_requests (client_id, property_id, status)
  values (v_actor, p_property_id, 'open')
  on conflict (client_id, property_id) do update
    set status = 'open',
        updated_at = timezone('utc', now())
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.request_availability_notify(uuid) from public;
grant execute on function public.request_availability_notify(uuid) to authenticated, service_role;

select public.seed_ops_intelligence_demo();
