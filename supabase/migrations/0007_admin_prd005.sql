-- PRD-005: Administração — admin read policies + assign certified_agent + platform stats

drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin
  on public.profiles for select to authenticated
  using (
    deleted_at is null
    and public.user_has_permission(auth.uid(), 'admin.panel')
  );

drop policy if exists user_roles_select_admin on public.user_roles;
create policy user_roles_select_admin
  on public.user_roles for select to authenticated
  using (public.user_has_permission(auth.uid(), 'admin.panel'));

create or replace function public.assign_certified_agent(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_role_id uuid;
  v_rowcount int;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not public.user_has_permission(v_actor, 'admin.panel') then
    raise exception 'admin.panel required';
  end if;

  if p_user_id is null then
    raise exception 'user id required';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = p_user_id and p.deleted_at is null
  ) then
    raise exception 'user not found';
  end if;

  select r.id into v_role_id
  from public.roles r
  where r.code = 'certified_agent' and r.deleted_at is null;

  if v_role_id is null then
    raise exception 'certified_agent role missing';
  end if;

  insert into public.user_roles (user_id, role_id, assigned_by)
  values (p_user_id, v_role_id, v_actor)
  on conflict (user_id, role_id) do nothing;

  get diagnostics v_rowcount = row_count;
  if v_rowcount > 0 then
    perform public.write_audit_log(
      'admin.role_assigned',
      'user_roles',
      p_user_id::text,
      jsonb_build_object('role', 'certified_agent', 'assigned_by', v_actor)
    );
  end if;
end;
$$;

revoke all on function public.assign_certified_agent(uuid) from public;
grant execute on function public.assign_certified_agent(uuid) to authenticated;

comment on function public.assign_certified_agent(uuid) is
  'PRD-005: Admin-only assignment of certified_agent. Idempotent.';

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
    )
  );
end;
$$;

revoke all on function public.admin_platform_stats() from public;
grant execute on function public.admin_platform_stats() to authenticated;

comment on function public.admin_platform_stats() is
  'PRD-005: Aggregate platform counts for admin hub.';
