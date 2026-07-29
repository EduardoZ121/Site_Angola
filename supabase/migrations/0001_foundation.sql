-- FASE 1 foundation: profiles, roles, permissions, user_roles, audit_logs
-- Multi-role RBAC: User is primary identity; roles are assigned capabilities.

create extension if not exists "pgcrypto";

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text not null default 'pt',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Roles (extensible — not a fixed product enum)
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

create trigger roles_set_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

-- Permissions (capabilities)
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create trigger permissions_set_updated_at
before update on public.permissions
for each row execute function public.set_updated_at();

-- Role ↔ Permission
create table if not exists public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (role_id, permission_id)
);

-- User ↔ Role (multi-role on one account)
create table if not exists public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  assigned_at timestamptz not null default timezone('utc', now()),
  assigned_by uuid references auth.users (id),
  primary key (user_id, role_id)
);

create index if not exists user_roles_user_id_idx on public.user_roles (user_id);
create index if not exists user_roles_role_id_idx on public.user_roles (role_id);

-- Audit log for important actions
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, created_by, updated_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.id,
    new.id
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: users can read/update own profile
create policy profiles_select_own
on public.profiles for select
to authenticated
using (auth.uid() = id and deleted_at is null);

create policy profiles_update_own
on public.profiles for update
to authenticated
using (auth.uid() = id and deleted_at is null)
with check (auth.uid() = id);

-- Roles / permissions: readable by authenticated (catalog)
create policy roles_select_authenticated
on public.roles for select
to authenticated
using (deleted_at is null);

create policy permissions_select_authenticated
on public.permissions for select
to authenticated
using (deleted_at is null);

create policy role_permissions_select_authenticated
on public.role_permissions for select
to authenticated
using (true);

-- User roles: users can see their own assignments
create policy user_roles_select_own
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

-- Audit logs: users can read own audit entries (admins via service role / later policies)
create policy audit_logs_select_own
on public.audit_logs for select
to authenticated
using (auth.uid() = actor_id);

-- Inserts into audit_logs typically via service role / security definer functions
create policy audit_logs_insert_authenticated
on public.audit_logs for insert
to authenticated
with check (auth.uid() = actor_id);

-- Storage buckets (empty, reserved)
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', false),
  ('property-media', 'property-media', false)
on conflict (id) do nothing;
