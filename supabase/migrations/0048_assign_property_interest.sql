-- 0048_assign_property_interest.sql
-- Doc2 P0 minimal agent lead ownership.
-- property_interests already has assigned_agent_id (0009). This adds a guarded RPC
-- so agents/admins assign leads with permission check + audit — without a second CRM.
--
-- Permission matrix (encoded for RLS regression / ops):
--   assign_property_interest:
--     - admin.panel → any interest
--     - agent.operate → self-assign only (p_agent_id null or = auth.uid())
--     - client / housing.explore alone → deny
--   Direct UPDATE of assigned_agent_id remains possible for admin/agent via existing
--   property_interests_update_ops policy; prefer this RPC for auditability.

create or replace function public.assign_property_interest(
  p_interest_id uuid,
  p_agent_id uuid default null
)
returns public.property_interests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_agent uuid;
  v_before public.property_interests;
  v_row public.property_interests;
  v_is_admin boolean;
  v_is_agent boolean;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  v_is_admin := public.user_has_permission(v_actor, 'admin.panel');
  v_is_agent := public.user_has_permission(v_actor, 'agent.operate');

  if not (v_is_admin or v_is_agent) then
    raise exception 'agent.operate or admin.panel required';
  end if;

  v_agent := coalesce(p_agent_id, v_actor);
  if not v_is_admin and v_agent <> v_actor then
    raise exception 'agents may only self-assign';
  end if;

  -- Target must be a certified agent (agent.operate).
  if not public.user_has_permission(v_agent, 'agent.operate') then
    raise exception 'target must have agent.operate';
  end if;

  select * into v_before
  from public.property_interests
  where id = p_interest_id;
  if not found then
    raise exception 'interest not found';
  end if;

  update public.property_interests
  set
    assigned_agent_id = v_agent,
    status = case
      when status in ('submitted', 'reviewing') then 'assigned'
      else status
    end,
    updated_by = v_actor,
    updated_at = timezone('utc', now())
  where id = p_interest_id
  returning * into v_row;

  perform public.write_audit_log(
    'property_interest.assigned',
    'property_interest',
    v_row.id::text,
    jsonb_build_object(
      'property_id', v_row.property_id,
      'from_agent', v_before.assigned_agent_id,
      'to_agent', v_row.assigned_agent_id,
      'status', v_row.status
    )
  );

  return v_row;
end;
$$;

revoke all on function public.assign_property_interest(uuid, uuid) from public;
grant execute on function public.assign_property_interest(uuid, uuid) to authenticated;

comment on function public.assign_property_interest(uuid, uuid) is
  'Assign property_interests.assigned_agent_id with RBAC + audit. Prefer over direct UPDATE.';
