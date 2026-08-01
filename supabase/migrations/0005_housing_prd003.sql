-- PRD-003: Habitação (Cliente) — housing.explore + discovery RLS + client_preferences
-- Reuses public.user_has_permission from migration 0002.

insert into public.permissions (code, description)
values ('housing.explore', 'Explorar habitação e guardar preferências de Cliente')
on conflict (code) do update
set description = excluded.description,
    updated_at = timezone('utc', now());

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'housing.explore'
where r.code in ('client', 'administrator')
on conflict do nothing;

-- Clients (and admins with housing.explore) may read active, non-deleted properties.
drop policy if exists properties_select_active_housing on public.properties;
create policy properties_select_active_housing
  on public.properties for select to authenticated
  using (
    deleted_at is null
    and status = 'active'
    and public.user_has_permission(auth.uid(), 'housing.explore')
  );

create table if not exists public.client_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  purpose text
    check (purpose is null or purpose in ('rent', 'sale', 'both')),
  province text,
  city text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id)
);

drop trigger if exists client_preferences_set_updated_at on public.client_preferences;
create trigger client_preferences_set_updated_at
before update on public.client_preferences
for each row execute function public.set_updated_at();

alter table public.client_preferences enable row level security;

drop policy if exists client_preferences_select_own on public.client_preferences;
create policy client_preferences_select_own
  on public.client_preferences for select to authenticated
  using (
    user_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'housing.explore')
  );

drop policy if exists client_preferences_insert_own on public.client_preferences;
create policy client_preferences_insert_own
  on public.client_preferences for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'housing.explore')
  );

drop policy if exists client_preferences_update_own on public.client_preferences;
create policy client_preferences_update_own
  on public.client_preferences for update to authenticated
  using (
    user_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'housing.explore')
  )
  with check (
    user_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'housing.explore')
  );

comment on table public.client_preferences is
  'PRD-003: Preferências leves do Cliente para discovery de habitação.';
