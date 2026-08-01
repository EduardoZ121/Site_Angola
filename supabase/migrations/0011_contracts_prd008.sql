-- PRD-008: Contratos — first expansion module after Core v1.0
-- Position: Confiança → Administração → Contrato → Pagamento → Conclusão

insert into public.permissions (code, description)
values ('contracts.manage', 'Gerir contratos entre Cliente, Parceiro Patrimonial e Agente')
on conflict (code) do update
set description = excluded.description,
    updated_at = timezone('utc', now());

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'contracts.manage'
where r.code in ('client', 'patrimonial_partner', 'certified_agent', 'administrator')
on conflict do nothing;

create sequence if not exists public.property_contracts_code_seq
  as integer
  start with 1
  increment by 1
  minvalue 1;

create or replace function public.next_property_contract_code()
returns text
language sql
as $$
  select 'KTK-CTR-' || lpad(nextval('public.property_contracts_code_seq')::text, 4, '0');
$$;

create table if not exists public.property_contracts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default public.next_property_contract_code(),
  property_id uuid not null references public.properties (id) on delete cascade,
  client_id uuid not null references auth.users (id) on delete cascade,
  partner_id uuid not null references auth.users (id) on delete cascade,
  agent_id uuid references auth.users (id) on delete set null,
  interest_id uuid references public.property_interests (id) on delete set null,
  purpose text not null
    check (purpose in ('rent', 'sale')),
  status text not null default 'draft'
    check (status in ('draft', 'pending_acceptance', 'active', 'completed', 'cancelled')),
  amount_aoa numeric(14, 2) not null
    check (amount_aoa > 0),
  currency text not null default 'AOA'
    check (currency = 'AOA'),
  title text not null,
  terms_notes text,
  is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

create index if not exists property_contracts_property_id_idx
  on public.property_contracts (property_id)
  where deleted_at is null;
create index if not exists property_contracts_client_id_idx
  on public.property_contracts (client_id)
  where deleted_at is null;
create index if not exists property_contracts_partner_id_idx
  on public.property_contracts (partner_id)
  where deleted_at is null;
create index if not exists property_contracts_agent_id_idx
  on public.property_contracts (agent_id)
  where deleted_at is null;
create index if not exists property_contracts_status_idx
  on public.property_contracts (status)
  where deleted_at is null;
create index if not exists property_contracts_demo_idx
  on public.property_contracts (is_demo)
  where deleted_at is null;

drop trigger if exists property_contracts_set_updated_at on public.property_contracts;
create trigger property_contracts_set_updated_at
before update on public.property_contracts
for each row execute function public.set_updated_at();

alter table public.property_contracts enable row level security;

drop policy if exists property_contracts_select_related on public.property_contracts;
create policy property_contracts_select_related
  on public.property_contracts for select to authenticated
  using (
    deleted_at is null
    and (
      client_id = auth.uid()
      or partner_id = auth.uid()
      or agent_id = auth.uid()
      or public.user_has_permission(auth.uid(), 'admin.panel')
      or (
        is_demo = true
        and public.user_has_permission(auth.uid(), 'contracts.manage')
      )
    )
  );

drop policy if exists property_contracts_insert_partner_admin on public.property_contracts;
create policy property_contracts_insert_partner_admin
  on public.property_contracts for insert to authenticated
  with check (
    public.user_has_permission(auth.uid(), 'contracts.manage')
    and (
      public.user_has_permission(auth.uid(), 'admin.panel')
      or partner_id = auth.uid()
    )
    and exists (
      select 1
      from public.properties p
      where p.id = property_id
        and p.deleted_at is null
        and p.owner_id = partner_id
    )
  );

comment on table public.property_contracts is
  'PRD-008: Contratos imobiliários MVP entre Cliente, Parceiro, Agente e Pagamento futuro.';

create or replace function public.create_property_contract(
  p_property_id uuid,
  p_client_id uuid,
  p_purpose text,
  p_amount_aoa numeric,
  p_title text,
  p_terms_notes text default null,
  p_agent_id uuid default null,
  p_interest_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_property public.properties%rowtype;
  v_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not public.user_has_permission(v_actor, 'contracts.manage') then
    raise exception 'contracts.manage required';
  end if;

  if p_purpose not in ('rent', 'sale') then
    raise exception 'invalid contract purpose';
  end if;

  if p_amount_aoa is null or p_amount_aoa <= 0 then
    raise exception 'amount required';
  end if;

  if p_title is null or length(trim(p_title)) < 3 then
    raise exception 'title required';
  end if;

  select *
  into v_property
  from public.properties
  where id = p_property_id
    and deleted_at is null
    and status = 'active';

  if not found then
    raise exception 'property not available';
  end if;

  if v_property.purpose not in (p_purpose, 'both') then
    raise exception 'property purpose mismatch';
  end if;

  if not public.user_has_permission(v_actor, 'admin.panel')
     and (
       v_property.owner_id is distinct from v_actor
       or not public.user_has_permission(v_actor, 'properties.manage')
     ) then
    raise exception 'partner or admin required';
  end if;

  if p_interest_id is not null and not exists (
    select 1
    from public.property_interests i
    where i.id = p_interest_id
      and i.property_id = p_property_id
      and i.client_id = p_client_id
  ) then
    raise exception 'interest does not match contract parties';
  end if;

  insert into public.property_contracts (
    property_id,
    client_id,
    partner_id,
    agent_id,
    interest_id,
    purpose,
    status,
    amount_aoa,
    title,
    terms_notes,
    is_demo,
    created_by,
    updated_by
  )
  values (
    p_property_id,
    p_client_id,
    v_property.owner_id,
    p_agent_id,
    p_interest_id,
    p_purpose,
    'pending_acceptance',
    round(p_amount_aoa, 2),
    trim(p_title),
    nullif(trim(coalesce(p_terms_notes, '')), ''),
    false,
    v_actor,
    v_actor
  )
  returning id into v_id;

  perform public.write_audit_log(
    'contract.created',
    'property_contract',
    v_id::text,
    jsonb_build_object('property_id', p_property_id, 'client_id', p_client_id)
  );

  return v_id;
end;
$$;

create or replace function public.accept_property_contract(p_contract_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not public.user_has_permission(v_actor, 'contracts.manage') then
    raise exception 'contracts.manage required';
  end if;

  update public.property_contracts
  set status = 'active',
      updated_by = v_actor
  where id = p_contract_id
    and deleted_at is null
    and status in ('draft', 'pending_acceptance')
    and (
      client_id = v_actor
      or public.user_has_permission(v_actor, 'admin.panel')
    );

  if not found then
    raise exception 'contract not found or cannot be accepted';
  end if;

  perform public.write_audit_log(
    'contract.accepted',
    'property_contract',
    p_contract_id::text,
    jsonb_build_object('accepted_by', v_actor)
  );
end;
$$;

create or replace function public.cancel_property_contract(p_contract_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not public.user_has_permission(v_actor, 'contracts.manage') then
    raise exception 'contracts.manage required';
  end if;

  update public.property_contracts
  set status = 'cancelled',
      updated_by = v_actor
  where id = p_contract_id
    and deleted_at is null
    and status in ('draft', 'pending_acceptance', 'active')
    and (
      client_id = v_actor
      or partner_id = v_actor
      or agent_id = v_actor
      or public.user_has_permission(v_actor, 'admin.panel')
    );

  if not found then
    raise exception 'contract not found or cannot be cancelled';
  end if;

  perform public.write_audit_log(
    'contract.cancelled',
    'property_contract',
    p_contract_id::text,
    jsonb_build_object('cancelled_by', v_actor)
  );
end;
$$;

create or replace function public.complete_property_contract(p_contract_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not public.user_has_permission(v_actor, 'contracts.manage') then
    raise exception 'contracts.manage required';
  end if;

  update public.property_contracts
  set status = 'completed',
      updated_by = v_actor
  where id = p_contract_id
    and deleted_at is null
    and status = 'active'
    and (
      partner_id = v_actor
      or agent_id = v_actor
      or public.user_has_permission(v_actor, 'admin.panel')
    );

  if not found then
    raise exception 'contract not found or cannot be completed';
  end if;

  perform public.write_audit_log(
    'contract.completed',
    'property_contract',
    p_contract_id::text,
    jsonb_build_object('completed_by', v_actor)
  );
end;
$$;

revoke all on function public.create_property_contract(uuid, uuid, text, numeric, text, text, uuid, uuid) from public;
revoke all on function public.accept_property_contract(uuid) from public;
revoke all on function public.cancel_property_contract(uuid) from public;
revoke all on function public.complete_property_contract(uuid) from public;

grant execute on function public.create_property_contract(uuid, uuid, text, numeric, text, text, uuid, uuid) to authenticated;
grant execute on function public.accept_property_contract(uuid) to authenticated;
grant execute on function public.cancel_property_contract(uuid) to authenticated;
grant execute on function public.complete_property_contract(uuid) to authenticated;

-- Admin stats expansion for the first post-Core module.
create or replace function public.admin_platform_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if not public.user_has_permission(v_actor, 'admin.panel') then
    raise exception 'admin.panel required';
  end if;

  return jsonb_build_object(
    'profiles', (select count(*)::int from public.profiles where deleted_at is null),
    'properties_active', (
      select count(*)::int from public.properties
      where deleted_at is null and status = 'active'
    ),
    'agent_assignments_active', (
      select count(*)::int from public.agent_assignments where status = 'active'
    ),
    'roles_certified_agent', (
      select count(*)::int
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where r.code = 'certified_agent'
    ),
    'trust_pending', (
      select count(*)::int from public.trust_documents
      where deleted_at is null and status in ('submitted', 'under_review')
    ),
    'interests_pending', (
      select count(*)::int from public.property_interests
      where status in ('submitted', 'reviewing')
    ),
    'properties_demo', (
      select count(*)::int from public.properties
      where deleted_at is null and is_demo = true
    ),
    'contracts_active', (
      select count(*)::int from public.property_contracts
      where deleted_at is null and status = 'active'
    ),
    'contracts_pending', (
      select count(*)::int from public.property_contracts
      where deleted_at is null and status = 'pending_acceptance'
    )
  );
end;
$$;

-- Demo contract graph: stable users + three contracts linked to KTK-DEMO properties.
create or replace function public.seed_demo_contracts()
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_partner uuid := 'a0000000-0000-4000-8000-0000000000d1';
  v_client uuid := 'a0000000-0000-4000-8000-0000000000c1';
  v_client_role uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_client,
    'authenticated',
    'authenticated',
    'demo.cliente@kuteka.local',
    crypt('DemoKuteka2026!', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Cliente Demo Kuteka"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now()),
    '', '', '', ''
  )
  on conflict (id) do nothing;

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  values (
    v_client,
    v_client,
    jsonb_build_object('sub', v_client::text, 'email', 'demo.cliente@kuteka.local'),
    'email',
    v_client::text,
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict do nothing;

  update public.profiles
  set display_name = 'Cliente Demo Kuteka',
      updated_by = v_client
  where id = v_client;

  select id into v_client_role from public.roles where code = 'client';
  if v_client_role is not null then
    insert into public.user_roles (user_id, role_id, assigned_by)
    values (v_client, v_client_role, v_client)
    on conflict do nothing;
  end if;

  insert into public.property_contracts (
    id, code, property_id, client_id, partner_id, purpose, status,
    amount_aoa, title, terms_notes, is_demo, created_by, updated_by
  )
  select *
  from (
    select
      'b1111111-1111-4111-8111-111111111001'::uuid as id,
      'KTK-CTR-0001'::text as code,
      p.id as property_id,
      v_client as client_id,
      coalesce(
        (select u.id from auth.users u where u.email = 'demo.parceiro@kuteka.local' limit 1),
        p.owner_id,
        v_partner
      ) as partner_id,
      'sale'::text as purpose,
      'active'::text as status,
      185000000::numeric as amount_aoa,
      'Contrato de compra — Moradia T4 Talatona'::text as title,
      'Minuta demo com aceitação digital e pagamento em expansão.'::text as terms_notes,
      true as is_demo,
      coalesce(p.owner_id, v_partner) as created_by,
      coalesce(p.owner_id, v_partner) as updated_by
    from public.properties p
    where p.code = 'KTK-DEMO-0001'
    union all
    select
      'b1111111-1111-4111-8111-111111111002'::uuid,
      'KTK-CTR-0002',
      p.id,
      v_client,
      coalesce(
        (select u.id from auth.users u where u.email = 'demo.parceiro@kuteka.local' limit 1),
        p.owner_id,
        v_partner
      ),
      'rent',
      'pending_acceptance',
      450000::numeric,
      'Contrato de arrendamento — Apartamento T3 Kilamba',
      'Minuta demo pendente de aceitação do Cliente.',
      true,
      coalesce(p.owner_id, v_partner),
      coalesce(p.owner_id, v_partner)
    from public.properties p
    where p.code = 'KTK-DEMO-0002'
    union all
    select
      'b1111111-1111-4111-8111-111111111003'::uuid,
      'KTK-CTR-0003',
      p.id,
      v_client,
      coalesce(
        (select u.id from auth.users u where u.email = 'demo.parceiro@kuteka.local' limit 1),
        p.owner_id,
        v_partner
      ),
      'sale',
      'completed',
      95000000::numeric,
      'Contrato concluído — Vivenda Benguela',
      'Minuta demo concluída para mostrar histórico operacional.',
      true,
      coalesce(p.owner_id, v_partner),
      coalesce(p.owner_id, v_partner)
    from public.properties p
    where p.code = 'KTK-DEMO-0003'
  ) demo
  on conflict (id) do update
  set code = excluded.code,
      property_id = excluded.property_id,
      client_id = excluded.client_id,
      partner_id = excluded.partner_id,
      purpose = excluded.purpose,
      status = excluded.status,
      amount_aoa = excluded.amount_aoa,
      title = excluded.title,
      terms_notes = excluded.terms_notes,
      is_demo = true,
      deleted_at = null,
      updated_by = excluded.updated_by;

  perform setval(
    'public.property_contracts_code_seq',
    greatest(
      3,
      coalesce((
        select max((regexp_match(code, '^KTK-CTR-([0-9]+)$'))[1]::int)
        from public.property_contracts
        where code ~ '^KTK-CTR-[0-9]+$'
      ), 0)
    ),
    true
  );
end;
$$;

revoke all on function public.seed_demo_contracts() from public;
grant execute on function public.seed_demo_contracts() to service_role;

select public.seed_demo_contracts();
