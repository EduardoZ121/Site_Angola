-- Core v1.0 hardening (auditoria pré-expansão)
-- - Tightens property_interests RLS (INSERT active-only; UPDATE scoped)
-- - Scopes get_user_role/permission_codes to self or admin.panel
-- - Ops helper to disable the demo partner account before public beta

-- ---------------------------------------------------------------------------
-- Interests: insert only against active inventory
-- ---------------------------------------------------------------------------

drop policy if exists property_interests_insert_client on public.property_interests;
create policy property_interests_insert_client
  on public.property_interests for insert to authenticated
  with check (
    client_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'housing.explore')
    and exists (
      select 1 from public.properties p
      where p.id = property_id
        and p.deleted_at is null
        and p.status = 'active'
    )
  );

-- ---------------------------------------------------------------------------
-- Interests: agents may only update interests they own or are assigned to
-- ---------------------------------------------------------------------------

drop policy if exists property_interests_update_ops on public.property_interests;
create policy property_interests_update_ops
  on public.property_interests for update to authenticated
  using (
    public.user_has_permission(auth.uid(), 'admin.panel')
    or (
      public.user_has_permission(auth.uid(), 'agent.operate')
      and (
        assigned_agent_id = auth.uid()
        or exists (
          select 1 from public.agent_assignments a
          where a.property_id = property_interests.property_id
            and a.agent_id = auth.uid()
            and a.status = 'active'
        )
      )
    )
  )
  with check (
    public.user_has_permission(auth.uid(), 'admin.panel')
    or (
      public.user_has_permission(auth.uid(), 'agent.operate')
      and (
        assigned_agent_id = auth.uid()
        or exists (
          select 1 from public.agent_assignments a
          where a.property_id = property_interests.property_id
            and a.agent_id = auth.uid()
            and a.status = 'active'
        )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- RBAC read helpers: no cross-user enumeration for non-admins
-- ---------------------------------------------------------------------------

create or replace function public.get_user_role_codes(p_user_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and auth.uid() is distinct from p_user_id
     and not public.user_has_permission(auth.uid(), 'admin.panel') then
    return '{}'::text[];
  end if;

  return coalesce(
    (
      select array_agg(r.code order by r.code)
      from public.user_roles ur
      inner join public.roles r on r.id = ur.role_id
      where ur.user_id = p_user_id
        and r.deleted_at is null
    ),
    '{}'::text[]
  );
end;
$$;

create or replace function public.get_user_permission_codes(p_user_id uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and auth.uid() is distinct from p_user_id
     and not public.user_has_permission(auth.uid(), 'admin.panel') then
    return '{}'::text[];
  end if;

  return coalesce(
    (
      select array_agg(distinct p.code order by p.code)
      from public.user_roles ur
      inner join public.roles r on r.id = ur.role_id
      inner join public.role_permissions rp on rp.role_id = r.id
      inner join public.permissions p on p.id = rp.permission_id
      where ur.user_id = p_user_id
        and r.deleted_at is null
        and p.deleted_at is null
    ),
    '{}'::text[]
  );
end;
$$;

comment on function public.get_user_permission_codes(uuid) is
  'Core v1.0: permission resolution; authenticated callers may only read self unless admin.panel.';

-- ---------------------------------------------------------------------------
-- Ops: disable known demo partner before public beta
-- ---------------------------------------------------------------------------

create or replace function public.disable_demo_partner_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.user_has_permission(auth.uid(), 'admin.panel') then
    raise exception 'admin.panel required';
  end if;

  update auth.users
  set banned_until = 'infinity'::timestamptz,
      updated_at = now()
  where email = 'demo.parceiro@kuteka.local';
end;
$$;

revoke all on function public.disable_demo_partner_account() from public;
grant execute on function public.disable_demo_partner_account() to authenticated, service_role;

comment on function public.disable_demo_partner_account() is
  'Core v1.0 go-live: ban demo.parceiro@kuteka.local before public beta.';
