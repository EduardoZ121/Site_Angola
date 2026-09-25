-- Retira uma tarefa operacional. Não apaga auditoria, não mexe no Owner e não toca em dinheiro.

create or replace function public.founder_revoke_operational_task(
  p_user_id uuid,
  p_target_role text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_role_id uuid;
  v_before text[];
  v_after text[];
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if not (public.is_platform_owner(v_actor) or public.is_founder(v_actor)) then
    raise exception 'founder required';
  end if;
  if p_reason is null or char_length(trim(p_reason)) < 3 then
    raise exception 'reason required';
  end if;
  if p_target_role not in ('super_administrator', 'administrator', 'supervisor', 'accountant') then
    raise exception 'this task cannot be revoked here';
  end if;
  if public.is_platform_owner(p_user_id) then
    raise exception 'cannot revoke the owner';
  end if;
  if p_target_role = 'super_administrator' and public.is_founder(p_user_id) then
    raise exception 'cannot remove super administrator from a founder';
  end if;

  select id into v_role_id from public.roles where code = p_target_role;
  if v_role_id is null then
    raise exception 'role missing in catalog';
  end if;

  select coalesce(array_agg(r.code order by r.code), '{}') into v_before
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = p_user_id;

  if not (p_target_role = any (v_before)) then
    raise exception 'task not assigned';
  end if;

  delete from public.user_roles
  where user_id = p_user_id
    and role_id = v_role_id;

  select coalesce(array_agg(r.code order by r.code), '{}') into v_after
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = p_user_id;

  perform public.record_user_activity(
    p_user_id,
    'role_revoked',
    'Tarefa operacional retirada',
    p_target_role,
    'user',
    p_user_id::text,
    jsonb_build_object('by', v_actor, 'reason', trim(p_reason))
  );

  perform public.write_audit_event(
    'institutional.revoke',
    'user',
    p_user_id::text,
    jsonb_build_object('targetRole', p_target_role),
    trim(p_reason),
    jsonb_build_object('roles', v_before),
    jsonb_build_object('roles', v_after),
    null,
    null
  );

  return jsonb_build_object(
    'userId', p_user_id,
    'targetRole', p_target_role,
    'rolesBefore', v_before,
    'rolesAfter', v_after
  );
end;
$$;

revoke all on function public.founder_revoke_operational_task(uuid, text, text) from public;
grant execute on function public.founder_revoke_operational_task(uuid, text, text) to authenticated;
