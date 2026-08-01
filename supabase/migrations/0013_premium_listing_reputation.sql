-- Premium polish: enriched listings, geo, timeline, reputation, role demos, superadmin

-- ─── Superadministrador ─────────────────────────────────────────────────────
insert into public.roles (code, name, description, is_system)
values (
  'super_administrator',
  'Superadministrador',
  'Visão executiva global da plataforma Kuteka',
  true
)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  is_system = excluded.is_system,
  updated_at = timezone('utc', now());

insert into public.permissions (code, description)
values
  ('executive.panel', 'Painel executivo / Superadministrador'),
  ('reputation.manage', 'Ler e escrever avaliações de reputação')
on conflict (code) do update
set description = excluded.description,
    updated_at = timezone('utc', now());

-- Superadmin inherits admin.panel + executive.panel + platform.access
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'super_administrator'
  and p.code in ('platform.access', 'admin.panel', 'executive.panel', 'reputation.manage',
                 'properties.manage', 'housing.explore', 'agent.operate', 'trust.manage', 'contracts.manage')
on conflict do nothing;

-- All operational roles can participate in reputation
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'reputation.manage'
where r.code in ('client', 'patrimonial_partner', 'certified_agent', 'administrator', 'super_administrator')
on conflict do nothing;

-- Administrator also gets executive read-only? Keep executive exclusive to superadmin.
-- Admin keeps admin.panel only.

-- ─── Property enrichment + geo ──────────────────────────────────────────────
alter table public.properties
  add column if not exists description text,
  add column if not exists video_url text,
  add column if not exists virtual_tour_url text,
  add column if not exists floor_plan_url text,
  add column if not exists documents_url text,
  add column if not exists year_built integer
    check (year_built is null or (year_built >= 1800 and year_built <= 2100)),
  add column if not exists renovated_year integer
    check (renovated_year is null or (renovated_year >= 1800 and renovated_year <= 2100)),
  add column if not exists area_useful_m2 numeric(12, 2),
  add column if not exists area_total_m2 numeric(12, 2),
  add column if not exists floors integer
    check (floors is null or (floors >= 0 and floors <= 200)),
  add column if not exists bathrooms integer
    check (bathrooms is null or (bathrooms >= 0 and bathrooms <= 50)),
  add column if not exists parking_spaces integer
    check (parking_spaces is null or (parking_spaces >= 0 and parking_spaces <= 100)),
  add column if not exists monthly_condo_aoa numeric(14, 2),
  add column if not exists condo_rules text,
  add column if not exists amenities jsonb not null default '[]'::jsonb,
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6),
  add column if not exists location_exact boolean not null default false,
  add column if not exists neighborhood text,
  add column if not exists nearby_notes text;

comment on column public.properties.location_exact is
  'When false, UI shows approximate zone only (privacy).';

-- ─── Property lifecycle timeline ────────────────────────────────────────────
create table if not exists public.property_timeline_events (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  event_type text not null,
  title text not null,
  summary text,
  actor_id uuid references auth.users (id),
  contract_id uuid references public.property_contracts (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  is_demo boolean not null default false,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists property_timeline_property_idx
  on public.property_timeline_events (property_id, occurred_at desc);

alter table public.property_timeline_events enable row level security;

drop policy if exists property_timeline_select on public.property_timeline_events;
create policy property_timeline_select
  on public.property_timeline_events for select to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id
        and p.deleted_at is null
        and (
          p.owner_id = auth.uid()
          or public.user_has_permission(auth.uid(), 'admin.panel')
          or public.user_has_permission(auth.uid(), 'executive.panel')
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

drop policy if exists property_timeline_insert on public.property_timeline_events;
create policy property_timeline_insert
  on public.property_timeline_events for insert to authenticated
  with check (
    public.user_has_permission(auth.uid(), 'admin.panel')
    or public.user_has_permission(auth.uid(), 'executive.panel')
    or exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  );

-- ─── Reputation / post-contract reviews (Airbnb-style) ──────────────────────
create table if not exists public.contract_reviews (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.property_contracts (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id),
  subject_kind text not null
    check (subject_kind in ('property', 'owner', 'agent', 'client', 'experience')),
  subject_user_id uuid references auth.users (id),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  dimensions jsonb not null default '{}'::jsonb,
  is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (contract_id, reviewer_id, subject_kind)
);

create index if not exists contract_reviews_property_idx
  on public.contract_reviews (property_id, created_at desc);

drop trigger if exists contract_reviews_set_updated_at on public.contract_reviews;
create trigger contract_reviews_set_updated_at
before update on public.contract_reviews
for each row execute function public.set_updated_at();

alter table public.contract_reviews enable row level security;

drop policy if exists contract_reviews_select on public.contract_reviews;
create policy contract_reviews_select
  on public.contract_reviews for select to authenticated
  using (
    public.user_has_permission(auth.uid(), 'reputation.manage')
    or public.user_has_permission(auth.uid(), 'admin.panel')
    or public.user_has_permission(auth.uid(), 'housing.explore')
  );

drop policy if exists contract_reviews_insert on public.contract_reviews;
create policy contract_reviews_insert
  on public.contract_reviews for insert to authenticated
  with check (
    reviewer_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'reputation.manage')
    and exists (
      select 1 from public.property_contracts c
      where c.id = contract_id
        and c.status = 'completed'
        and c.deleted_at is null
        and (c.client_id = auth.uid() or c.partner_id = auth.uid() or c.agent_id = auth.uid())
    )
  );

-- ─── Seed: enrich demo properties + geo (Luanda area) ───────────────────────
create or replace function public.seed_premium_listing_enrichment()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  idx int := 0;
  base_lat numeric := -8.838333;
  base_lng numeric := 13.234444;
begin
  for r in
    select id, code, bedrooms, price_aoa, city, province, is_demo
    from public.properties
    where is_demo = true and deleted_at is null
    order by code
  loop
    idx := idx + 1;
    update public.properties
    set
      description = coalesce(
        description,
        'Património premium em ' || coalesce(city, 'Luanda') ||
        '. Espaços amplos, boa luminosidade e localização estratégica para viver ou investir com confiança na Kuteka.'
      ),
      year_built = coalesce(year_built, 2008 + (idx % 15)),
      renovated_year = coalesce(renovated_year, case when idx % 3 = 0 then 2022 else null end),
      area_useful_m2 = coalesce(area_useful_m2, 85 + (idx * 7) % 160),
      area_total_m2 = coalesce(area_total_m2, 110 + (idx * 9) % 220),
      floors = coalesce(floors, 1 + (idx % 4)),
      bathrooms = coalesce(bathrooms, greatest(1, coalesce(bedrooms, 2) - 1)),
      parking_spaces = coalesce(parking_spaces, idx % 3),
      monthly_condo_aoa = coalesce(monthly_condo_aoa, 25000 + (idx * 3500)),
      condo_rules = coalesce(
        condo_rules,
        'Silêncio após as 22h. Animais de estimação sujeitos a aprovação. Visitantes devem registar-se na portaria.'
      ),
      amenities = case
        when jsonb_array_length(coalesce(amenities, '[]'::jsonb)) > 0 then amenities
        else jsonb_build_array(
          'internet',
          'energia',
          'agua',
          'seguranca',
          case when idx % 2 = 0 then 'estacionamento' else 'acessibilidade' end,
          case when idx % 3 = 0 then 'piscina' else 'jardim' end
        )
      end,
      latitude = coalesce(latitude, base_lat + ((idx % 12) * 0.008)),
      longitude = coalesce(longitude, base_lng + ((idx % 10) * 0.007)),
      location_exact = coalesce(location_exact, (idx % 4 = 0)),
      neighborhood = coalesce(neighborhood, case (idx % 5)
        when 0 then 'Talatona'
        when 1 then 'Miramar'
        when 2 then 'Maianga'
        when 3 then 'Kilamba'
        else 'Maculusso'
      end),
      nearby_notes = coalesce(
        nearby_notes,
        'Escolas, supermercados, bancos e hospitais a menos de 15 minutos. Acesso rápido ao centro de Luanda.'
      ),
      video_url = coalesce(video_url, null),
      updated_at = timezone('utc', now())
    where id = r.id;
  end loop;
end;
$$;

revoke all on function public.seed_premium_listing_enrichment() from public;
grant execute on function public.seed_premium_listing_enrichment() to authenticated;

-- ─── Seed demo agent / admin / superadmin + reviews + timeline ──────────────
create or replace function public.seed_premium_role_demos()
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_partner uuid := 'a0000000-0000-4000-8000-0000000000d1';
  v_client uuid := 'a0000000-0000-4000-8000-0000000000c1';
  v_agent uuid := 'a0000000-0000-4000-8000-0000000000a1';
  v_admin uuid := 'a0000000-0000-4000-8000-0000000000b1';
  v_super uuid := 'a0000000-0000-4000-8000-0000000000e1';
  v_prop uuid;
  v_contract uuid;
  v_role uuid;
begin
  -- Agent
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_agent, 'authenticated', 'authenticated',
    'demo.agente@kuteka.local', crypt('DemoKuteka2026!', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Demo Agente Kuteka"}'::jsonb,
    timezone('utc', now()), timezone('utc', now()), '', '', '', ''
  ) on conflict (id) do nothing;
  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (
    v_agent, v_agent,
    jsonb_build_object('sub', v_agent::text, 'email', 'demo.agente@kuteka.local'),
    'email', v_agent::text, timezone('utc', now()), timezone('utc', now()), timezone('utc', now())
  ) on conflict do nothing;
  update public.profiles set display_name = 'Demo Agente Kuteka', updated_by = v_agent where id = v_agent;
  select id into v_role from public.roles where code = 'certified_agent';
  if v_role is not null then
    insert into public.user_roles (user_id, role_id, assigned_by) values (v_agent, v_role, v_agent) on conflict do nothing;
  end if;

  -- Admin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_admin, 'authenticated', 'authenticated',
    'demo.admin@kuteka.local', crypt('DemoKuteka2026!', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Demo Administrador"}'::jsonb,
    timezone('utc', now()), timezone('utc', now()), '', '', '', ''
  ) on conflict (id) do nothing;
  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (
    v_admin, v_admin,
    jsonb_build_object('sub', v_admin::text, 'email', 'demo.admin@kuteka.local'),
    'email', v_admin::text, timezone('utc', now()), timezone('utc', now()), timezone('utc', now())
  ) on conflict do nothing;
  update public.profiles set display_name = 'Demo Administrador', updated_by = v_admin where id = v_admin;
  select id into v_role from public.roles where code = 'administrator';
  if v_role is not null then
    insert into public.user_roles (user_id, role_id, assigned_by) values (v_admin, v_role, v_admin) on conflict do nothing;
  end if;

  -- Superadmin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_super, 'authenticated', 'authenticated',
    'demo.super@kuteka.local', crypt('DemoKuteka2026!', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Demo Superadministrador"}'::jsonb,
    timezone('utc', now()), timezone('utc', now()), '', '', '', ''
  ) on conflict (id) do nothing;
  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (
    v_super, v_super,
    jsonb_build_object('sub', v_super::text, 'email', 'demo.super@kuteka.local'),
    'email', v_super::text, timezone('utc', now()), timezone('utc', now()), timezone('utc', now())
  ) on conflict do nothing;
  update public.profiles set display_name = 'Demo Superadministrador', updated_by = v_super where id = v_super;
  select id into v_role from public.roles where code = 'super_administrator';
  if v_role is not null then
    insert into public.user_roles (user_id, role_id, assigned_by) values (v_super, v_role, v_super) on conflict do nothing;
  end if;

  update public.property_contracts
  set agent_id = coalesce(agent_id, v_agent)
  where is_demo = true and deleted_at is null and agent_id is null;

  perform public.seed_premium_listing_enrichment();

  select id into v_prop from public.properties where code = 'KTK-DEMO-0001' and deleted_at is null limit 1;
  select id into v_contract from public.property_contracts
  where is_demo = true and status = 'completed' and deleted_at is null limit 1;

  if v_prop is not null then
    delete from public.property_timeline_events where property_id = v_prop and is_demo = true;
    insert into public.property_timeline_events
      (property_id, event_type, title, summary, actor_id, contract_id, is_demo, occurred_at)
    values
      (v_prop, 'published', 'Publicado', 'Anúncio activo na plataforma.', v_partner, null, true, timezone('utc', now()) - interval '21 days'),
      (v_prop, 'interest', 'Primeiro interesse', 'Cliente demonstrou interesse.', v_client, null, true, timezone('utc', now()) - interval '18 days'),
      (v_prop, 'visit', 'Visita', 'Visita acompanhada pelo agente.', v_agent, null, true, timezone('utc', now()) - interval '14 days'),
      (v_prop, 'proposal', 'Proposta', 'Proposta formal apresentada.', v_client, null, true, timezone('utc', now()) - interval '10 days'),
      (v_prop, 'negotiation', 'Negociação', 'Ajuste de condições entre as partes.', v_partner, null, true, timezone('utc', now()) - interval '7 days'),
      (v_prop, 'contract', 'Contrato', 'Minuta aceite pelas partes.', v_partner, v_contract, true, timezone('utc', now()) - interval '4 days'),
      (v_prop, 'payment', 'Pagamento', 'Preparação de pagamento concluída (demo).', v_client, v_contract, true, timezone('utc', now()) - interval '2 days'),
      (v_prop, 'review', 'Avaliação', 'Avaliações de reputação registadas.', v_client, v_contract, true, timezone('utc', now()) - interval '1 day'),
      (v_prop, 'completed', 'Concluído', 'Ciclo comercial concluído com sucesso.', v_partner, v_contract, true, timezone('utc', now()) - interval '12 hours');
  end if;

  if v_contract is not null and v_prop is not null then
    delete from public.contract_reviews where contract_id = v_contract and is_demo = true;
    insert into public.contract_reviews
      (contract_id, property_id, reviewer_id, subject_kind, subject_user_id, rating, comment, dimensions, is_demo)
    values
      (v_contract, v_prop, v_client, 'property', null, 5,
       'Imóvel em excelente estado, limpo e bem localizado.',
       '{"estado":5,"limpeza":5,"localizacao":5}'::jsonb, true),
      (v_contract, v_prop, v_client, 'owner', v_partner, 5,
       'Proprietário transparente e honesto durante toda a negociação.',
       '{"honestidade":5,"negociacao":5}'::jsonb, true),
      (v_contract, v_prop, v_client, 'agent', v_agent, 4,
       'Agente rápido e presente nas visitas.',
       '{"rapidez":5,"acompanhamento":4}'::jsonb, true),
      (v_contract, v_prop, v_client, 'experience', null, 5,
       'Experiência geral muito positiva — confiança total na Kuteka.',
       '{"experiencia_geral":5}'::jsonb, true),
      (v_contract, v_prop, v_partner, 'client', v_client, 5,
       'Cliente sério, documentação em dia e comunicação clara.',
       '{"seriedade":5,"comunicacao":5}'::jsonb, true),
      (v_contract, v_prop, v_partner, 'agent', v_agent, 4,
       'Bom acompanhamento no terreno.',
       '{"desempenho":4}'::jsonb, true);
  end if;
end;
$$;

revoke all on function public.seed_premium_role_demos() from public;
grant execute on function public.seed_premium_role_demos() to authenticated;

select public.seed_premium_role_demos();
