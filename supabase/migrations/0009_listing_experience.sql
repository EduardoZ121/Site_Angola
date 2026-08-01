-- MVP experience: listing media, price, interests, storage policies, demo catalog, admin stats

-- ─── Properties: listing fields ─────────────────────────────────────────────
alter table public.properties
  add column if not exists price_aoa numeric(14, 2),
  add column if not exists bedrooms integer
    check (bedrooms is null or (bedrooms >= 0 and bedrooms <= 50)),
  add column if not exists cover_image_url text,
  add column if not exists is_demo boolean not null default false;

create index if not exists properties_is_demo_idx
  on public.properties (is_demo)
  where deleted_at is null;

-- ─── Property media ─────────────────────────────────────────────────────────
create table if not exists public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  storage_path text,
  public_url text not null,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

create index if not exists property_media_property_id_idx
  on public.property_media (property_id)
  where deleted_at is null;

drop trigger if exists property_media_set_updated_at on public.property_media;
create trigger property_media_set_updated_at
before update on public.property_media
for each row execute function public.set_updated_at();

alter table public.property_media enable row level security;

drop policy if exists property_media_select_visible on public.property_media;
create policy property_media_select_visible
  on public.property_media for select to authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from public.properties p
      where p.id = property_id
        and p.deleted_at is null
        and (
          p.owner_id = auth.uid()
          or public.user_has_permission(auth.uid(), 'admin.panel')
          or (
            p.status = 'active'
            and (
              public.user_has_permission(auth.uid(), 'housing.explore')
              or public.user_has_permission(auth.uid(), 'agent.operate')
            )
          )
        )
    )
  );

drop policy if exists property_media_insert_owner on public.property_media;
create policy property_media_insert_owner
  on public.property_media for insert to authenticated
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and p.deleted_at is null
        and p.owner_id = auth.uid()
        and public.user_has_permission(auth.uid(), 'properties.manage')
    )
  );

drop policy if exists property_media_update_owner on public.property_media;
create policy property_media_update_owner
  on public.property_media for update to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and p.owner_id = auth.uid()
        and public.user_has_permission(auth.uid(), 'properties.manage')
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and p.owner_id = auth.uid()
        and public.user_has_permission(auth.uid(), 'properties.manage')
    )
  );

drop policy if exists property_media_delete_owner on public.property_media;
create policy property_media_delete_owner
  on public.property_media for delete to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and p.owner_id = auth.uid()
        and public.user_has_permission(auth.uid(), 'properties.manage')
    )
  );

comment on table public.property_media is
  'Listing photos for properties (primary + ordered gallery).';

-- ─── Storage bucket (public read for listing cards) ─────────────────────────
update storage.buckets
set public = true
where id = 'property-media';

drop policy if exists property_media_storage_select on storage.objects;
create policy property_media_storage_select
  on storage.objects for select
  using (bucket_id = 'property-media');

drop policy if exists property_media_storage_insert on storage.objects;
create policy property_media_storage_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.user_has_permission(auth.uid(), 'properties.manage')
  );

drop policy if exists property_media_storage_update on storage.objects;
create policy property_media_storage_update
  on storage.objects for update to authenticated
  using (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.user_has_permission(auth.uid(), 'properties.manage')
  );

drop policy if exists property_media_storage_delete on storage.objects;
create policy property_media_storage_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'property-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.user_has_permission(auth.uid(), 'properties.manage')
  );

-- ─── Property interests (Cliente → Património) ──────────────────────────────
create table if not exists public.property_interests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  status text not null default 'submitted'
    check (status in ('submitted', 'reviewing', 'assigned', 'closed')),
  notes text,
  assigned_agent_id uuid references auth.users (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  unique (client_id, property_id)
);

create index if not exists property_interests_property_id_idx
  on public.property_interests (property_id);
create index if not exists property_interests_status_idx
  on public.property_interests (status);

drop trigger if exists property_interests_set_updated_at on public.property_interests;
create trigger property_interests_set_updated_at
before update on public.property_interests
for each row execute function public.set_updated_at();

alter table public.property_interests enable row level security;

drop policy if exists property_interests_select_related on public.property_interests;
create policy property_interests_select_related
  on public.property_interests for select to authenticated
  using (
    client_id = auth.uid()
    or assigned_agent_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'admin.panel')
    or exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
    or (
      public.user_has_permission(auth.uid(), 'agent.operate')
      and exists (
        select 1 from public.agent_assignments a
        where a.property_id = property_interests.property_id
          and a.agent_id = auth.uid()
          and a.status = 'active'
      )
    )
  );

drop policy if exists property_interests_insert_client on public.property_interests;
create policy property_interests_insert_client
  on public.property_interests for insert to authenticated
  with check (
    client_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'housing.explore')
  );

drop policy if exists property_interests_update_ops on public.property_interests;
create policy property_interests_update_ops
  on public.property_interests for update to authenticated
  using (
    public.user_has_permission(auth.uid(), 'admin.panel')
    or public.user_has_permission(auth.uid(), 'agent.operate')
  )
  with check (
    public.user_has_permission(auth.uid(), 'admin.panel')
    or public.user_has_permission(auth.uid(), 'agent.operate')
  );

create or replace function public.express_property_interest(
  p_property_id uuid,
  p_notes text default null
)
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
    raise exception 'authentication required';
  end if;
  if not public.user_has_permission(v_actor, 'housing.explore') then
    raise exception 'housing.explore required';
  end if;

  if not exists (
    select 1 from public.properties p
    where p.id = p_property_id and p.deleted_at is null and p.status = 'active'
  ) then
    raise exception 'property not available';
  end if;

  insert into public.property_interests (
    client_id, property_id, status, notes, created_by, updated_by
  )
  values (
    v_actor, p_property_id, 'submitted',
    nullif(trim(coalesce(p_notes, '')), ''),
    v_actor, v_actor
  )
  on conflict (client_id, property_id) do update
  set notes = coalesce(excluded.notes, public.property_interests.notes),
      status = case
        when public.property_interests.status = 'closed' then 'submitted'
        else public.property_interests.status
      end,
      updated_by = v_actor
  returning id into v_id;

  perform public.write_audit_log(
    'property.interest_expressed',
    'property_interest',
    v_id::text,
    jsonb_build_object('property_id', p_property_id)
  );

  return v_id;
end;
$$;

revoke all on function public.express_property_interest(uuid, text) from public;
grant execute on function public.express_property_interest(uuid, text) to authenticated;

-- ─── Admin stats expansion ──────────────────────────────────────────────────
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
    )
  );
end;
$$;

-- ─── Demo catalog (stable UUIDs, premium stock imagery) ─────────────────────
create or replace function public.seed_demo_catalog()
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_owner uuid := 'a0000000-0000-4000-8000-0000000000d1';
  v_partner_role uuid;
begin
  -- Demo partner identity (login not required for catalog browse)
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  )
  values (
    '00000000-0000-0000-0000-000000000000',
    v_owner,
    'authenticated',
    'authenticated',
    'demo.parceiro@kuteka.local',
    crypt('DemoKuteka2026!', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Parceiro Demo Kuteka"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now()),
    '', '', '', ''
  )
  on conflict (id) do nothing;

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  values (
    v_owner,
    v_owner,
    jsonb_build_object('sub', v_owner::text, 'email', 'demo.parceiro@kuteka.local'),
    'email',
    v_owner::text,
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict do nothing;

  update public.profiles
  set display_name = 'Parceiro Demo Kuteka',
      updated_by = v_owner
  where id = v_owner;

  select id into v_partner_role from public.roles where code = 'patrimonial_partner';
  if v_partner_role is not null then
    insert into public.user_roles (user_id, role_id, assigned_by)
    values (v_owner, v_partner_role, v_owner)
    on conflict do nothing;
  end if;

  -- Upsert five Angola-oriented demo listings
  insert into public.properties (
    id, owner_id, code, title, property_type, purpose,
    province, city, address_line, status, notes,
    price_aoa, bedrooms, cover_image_url, is_demo,
    created_by, updated_by
  )
  values
    (
      'a1111111-1111-4111-8111-111111111001',
      v_owner, 'KTK-DEMO-0001', 'Moradia T4 Talatona',
      'house', 'sale', 'Luanda', 'Talatona', 'Condomínio Belas Business Park',
      'active', 'Moradia contemporânea com jardim e piscina. Demonstração Kuteka.',
      185000000, 4,
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111002',
      v_owner, 'KTK-DEMO-0002', 'Apartamento T3 Kilamba',
      'apartment', 'rent', 'Luanda', 'Kilamba', 'Centralidade do Kilamba',
      'active', 'Apartamento luminoso com varanda. Demonstração Kuteka.',
      450000, 3,
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111003',
      v_owner, 'KTK-DEMO-0003', 'Vivenda Benguela',
      'house', 'sale', 'Benguela', 'Benguela', 'Zona residencial costeira',
      'active', 'Vivenda familiar perto do mar. Demonstração Kuteka.',
      95000000, 5,
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111004',
      v_owner, 'KTK-DEMO-0004', 'Penthouse Luanda Sul',
      'apartment', 'sale', 'Luanda', 'Luanda Sul', 'Torre residencial premium',
      'active', 'Penthouse com vista baía e terraço. Demonstração Kuteka.',
      320000000, 4,
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    ),
    (
      'a1111111-1111-4111-8111-111111111005',
      v_owner, 'KTK-DEMO-0005', 'Fazenda Huambo',
      'land', 'sale', 'Huambo', 'Huambo', 'Estrada para Caála',
      'active', 'Propriedade rural com potencial agrícola. Demonstração Kuteka.',
      75000000, null,
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80',
      true, v_owner, v_owner
    )
  on conflict (id) do update
  set title = excluded.title,
      property_type = excluded.property_type,
      purpose = excluded.purpose,
      province = excluded.province,
      city = excluded.city,
      address_line = excluded.address_line,
      status = 'active',
      notes = excluded.notes,
      price_aoa = excluded.price_aoa,
      bedrooms = excluded.bedrooms,
      cover_image_url = excluded.cover_image_url,
      is_demo = true,
      deleted_at = null,
      updated_by = v_owner;

  -- Primary media rows (idempotent by deleting demo media then reinsert)
  delete from public.property_media
  where property_id in (
    'a1111111-1111-4111-8111-111111111001',
    'a1111111-1111-4111-8111-111111111002',
    'a1111111-1111-4111-8111-111111111003',
    'a1111111-1111-4111-8111-111111111004',
    'a1111111-1111-4111-8111-111111111005'
  );

  insert into public.property_media (
    property_id, public_url, sort_order, is_primary, created_by, updated_by
  )
  values
    ('a1111111-1111-4111-8111-111111111001',
     'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80',
     0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111001',
     'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
     1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111002',
     'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80',
     0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111002',
     'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80',
     1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111003',
     'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80',
     0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111004',
     'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80',
     0, true, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111004',
     'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80',
     1, false, v_owner, v_owner),
    ('a1111111-1111-4111-8111-111111111005',
     'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80',
     0, true, v_owner, v_owner);
end;
$$;

revoke all on function public.seed_demo_catalog() from public;
grant execute on function public.seed_demo_catalog() to service_role;

select public.seed_demo_catalog();
