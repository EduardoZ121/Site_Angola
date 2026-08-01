-- PRD-002: properties (Ativar Património) + permission properties.manage
-- Reuses public.user_has_permission from migration 0002.

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  code text not null unique,
  title text not null,
  property_type text not null
    check (property_type in ('apartment', 'house', 'land', 'commercial')),
  purpose text not null
    check (purpose in ('rent', 'sale', 'both')),
  province text,
  city text,
  address_line text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'archived')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

create index if not exists properties_owner_id_idx on public.properties (owner_id);
create index if not exists properties_status_idx on public.properties (status);
create index if not exists properties_owner_active_idx
  on public.properties (owner_id)
  where deleted_at is null;

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

insert into public.permissions (code, description)
values ('properties.manage', 'Activar e gerir patrimónios próprios')
on conflict (code) do update
set description = excluded.description,
    updated_at = timezone('utc', now());

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'properties.manage'
where r.code in ('patrimonial_partner', 'administrator')
on conflict do nothing;

alter table public.properties enable row level security;

drop policy if exists properties_select_own on public.properties;
create policy properties_select_own
  on public.properties for select to authenticated
  using (
    deleted_at is null
    and (
      owner_id = auth.uid()
      or public.user_has_permission(auth.uid(), 'admin.panel')
    )
  );

drop policy if exists properties_insert_own on public.properties;
create policy properties_insert_own
  on public.properties for insert to authenticated
  with check (
    owner_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'properties.manage')
  );

drop policy if exists properties_update_own on public.properties;
create policy properties_update_own
  on public.properties for update to authenticated
  using (
    owner_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'properties.manage')
  )
  with check (
    owner_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'properties.manage')
  );

comment on table public.properties is
  'PRD-002: Patrimónios activados pelo Parceiro Patrimonial (não marketplace).';
