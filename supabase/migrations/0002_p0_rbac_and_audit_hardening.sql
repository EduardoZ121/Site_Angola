-- P0: single-source RBAC helpers + hardened audit_logs
-- Source of truth for role→permission mappings remains seed SQL / tables.
-- Application code must resolve permissions via these functions or equivalent queries.

-- ---------------------------------------------------------------------------
-- P0-1: Authorization resolution from PostgreSQL
-- ---------------------------------------------------------------------------

create or replace function public.get_user_role_codes(p_user_id uuid)
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(r.code order by r.code), '{}'::text[])
  from public.user_roles ur
  inner join public.roles r on r.id = ur.role_id
  where ur.user_id = p_user_id
    and r.deleted_at is null;
$$;

create or replace function public.get_user_permission_codes(p_user_id uuid)
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(distinct p.code order by p.code), '{}'::text[])
  from public.user_roles ur
  inner join public.roles r on r.id = ur.role_id
  inner join public.role_permissions rp on rp.role_id = r.id
  inner join public.permissions p on p.id = rp.permission_id
  where ur.user_id = p_user_id
    and r.deleted_at is null
    and p.deleted_at is null;
$$;

create or replace function public.user_has_permission(p_user_id uuid, p_permission_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    inner join public.roles r on r.id = ur.role_id
    inner join public.role_permissions rp on rp.role_id = r.id
    inner join public.permissions p on p.id = rp.permission_id
    where ur.user_id = p_user_id
      and p.code = p_permission_code
      and r.deleted_at is null
      and p.deleted_at is null
  );
$$;

revoke all on function public.get_user_role_codes(uuid) from public;
revoke all on function public.get_user_permission_codes(uuid) from public;
revoke all on function public.user_has_permission(uuid, text) from public;

grant execute on function public.get_user_role_codes(uuid) to authenticated, service_role;
grant execute on function public.get_user_permission_codes(uuid) to authenticated, service_role;
grant execute on function public.user_has_permission(uuid, text) to authenticated, service_role;

comment on function public.get_user_permission_codes(uuid) is
  'P0-1: Official permission resolution. Application RBAC must use DB-derived codes, not a hardcoded TS matrix.';

-- ---------------------------------------------------------------------------
-- P0-2: Audit log integrity — no direct client inserts/updates/deletes
-- ---------------------------------------------------------------------------

drop policy if exists audit_logs_insert_authenticated on public.audit_logs;

-- Explicit deny for mutations via RLS (even if grants slip)
create policy audit_logs_no_update
on public.audit_logs for update
to authenticated, anon
using (false);

create policy audit_logs_no_delete
on public.audit_logs for delete
to authenticated, anon
using (false);

revoke insert, update, delete on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;
grant insert, select on public.audit_logs to service_role;

create or replace function public.write_audit_log(
  p_action text,
  p_entity_type text default null,
  p_entity_id text default null,
  p_metadata jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_actor uuid := auth.uid();
begin
  if p_action is null or length(trim(p_action)) = 0 then
    raise exception 'audit action is required';
  end if;

  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_actor,
    trim(p_action),
    p_entity_type,
    p_entity_id,
    p_metadata
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.write_audit_log(text, text, text, jsonb) from public;
grant execute on function public.write_audit_log(text, text, text, jsonb) to authenticated, service_role;

comment on function public.write_audit_log(text, text, text, jsonb) is
  'P0-2: Controlled audit write path. Direct INSERT on audit_logs is revoked for authenticated clients.';
