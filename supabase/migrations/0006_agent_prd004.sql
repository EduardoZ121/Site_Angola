-- PRD-004: Agente Certificado — agent.operate + discovery RLS + prefs + assignments

insert into public.permissions (code, description)
values ('agent.operate', 'Operar como Agente Certificado (preferências, discovery e acompanhamentos)')
on conflict (code) do update
set description = excluded.description,
    updated_at = timezone('utc', now());

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'agent.operate'
where r.code in ('certified_agent', 'administrator')
on conflict do nothing;

drop policy if exists properties_select_active_agent on public.properties;
create policy properties_select_active_agent
  on public.properties for select to authenticated
  using (
    deleted_at is null
    and status = 'active'
    and public.user_has_permission(auth.uid(), 'agent.operate')
  );

create table if not exists public.agent_preferences (
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

drop trigger if exists agent_preferences_set_updated_at on public.agent_preferences;
create trigger agent_preferences_set_updated_at
before update on public.agent_preferences
for each row execute function public.set_updated_at();

alter table public.agent_preferences enable row level security;

drop policy if exists agent_preferences_select_own on public.agent_preferences;
create policy agent_preferences_select_own
  on public.agent_preferences for select to authenticated
  using (
    user_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'agent.operate')
  );

drop policy if exists agent_preferences_insert_own on public.agent_preferences;
create policy agent_preferences_insert_own
  on public.agent_preferences for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'agent.operate')
  );

drop policy if exists agent_preferences_update_own on public.agent_preferences;
create policy agent_preferences_update_own
  on public.agent_preferences for update to authenticated
  using (
    user_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'agent.operate')
  )
  with check (
    user_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'agent.operate')
  );

create table if not exists public.agent_assignments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references auth.users (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'released')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  unique (agent_id, property_id)
);

create index if not exists agent_assignments_agent_id_idx
  on public.agent_assignments (agent_id);
create index if not exists agent_assignments_property_id_idx
  on public.agent_assignments (property_id);

drop trigger if exists agent_assignments_set_updated_at on public.agent_assignments;
create trigger agent_assignments_set_updated_at
before update on public.agent_assignments
for each row execute function public.set_updated_at();

alter table public.agent_assignments enable row level security;

drop policy if exists agent_assignments_select_own on public.agent_assignments;
create policy agent_assignments_select_own
  on public.agent_assignments for select to authenticated
  using (
    agent_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'agent.operate')
  );

drop policy if exists agent_assignments_insert_own on public.agent_assignments;
create policy agent_assignments_insert_own
  on public.agent_assignments for insert to authenticated
  with check (
    agent_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'agent.operate')
  );

drop policy if exists agent_assignments_update_own on public.agent_assignments;
create policy agent_assignments_update_own
  on public.agent_assignments for update to authenticated
  using (
    agent_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'agent.operate')
  )
  with check (
    agent_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'agent.operate')
  );

comment on table public.agent_assignments is
  'PRD-004: Acompanhamentos activados pelo Agente Certificado sobre patrimónios activos.';
