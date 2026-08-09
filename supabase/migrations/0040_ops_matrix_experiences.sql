-- 0040_ops_matrix_experiences.sql
-- Sprint Beta 1.6 — fechar B+C da matriz operacional (Founder mode, escalação).
-- Sem Board/Investor UI. Aditivo.

-- ═══════════════════════════════════════════════════════════════════════════
-- 0. Founder role code + backfill from founders table
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.roles (code, name, description, is_system)
values (
  'founder',
  'Founder',
  'Fundador / Owner — governação institucional máxima',
  true
)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    is_system = true,
    updated_at = timezone('utc', now());

-- Founders get founder role (in addition to super_administrator already granted)
insert into public.user_roles (user_id, role_id)
select f.user_id, r.id
from public.founders f
join public.roles r on r.code = 'founder'
on conflict do nothing;

-- Co-founders already have co_founder; ensure they keep super surface
insert into public.user_roles (user_id, role_id)
select f.user_id, r.id
from public.founders f
join public.roles r on r.code = 'super_administrator'
where f.is_founder = true
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'founder'
  and p.code in (
    'platform.access',
    'admin.panel',
    'properties.review',
    'audit.read',
    'moderation.manage',
    'executive.panel',
    'finance.manage',
    'finance.read',
    'founder.manage',
    'trust.manage',
    'contracts.manage',
    'housing.explore',
    'agent.operate',
    'reputation.manage'
  )
on conflict do nothing;

-- Patch bootstrap to also grant founder role
create or replace function public.founder_bootstrap_claim(
  p_display_label text default 'Founder / Owner'
)
returns public.founders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_row public.founders;
begin
  if v_actor is null then raise exception 'authentication required'; end if;

  if exists (select 1 from public.founders where is_owner = true) then
    raise exception 'founder bootstrap already completed';
  end if;
  if exists (
    select 1 from public.founder_bootstrap_state where id = 1 and completed_at is not null
  ) then
    raise exception 'founder bootstrap permanently locked';
  end if;

  if exists (
    select 1 from auth.users u
    where u.id = v_actor and u.email ilike 'demo.%@kuteka.local'
  ) then
    raise exception 'system demo accounts cannot become Founder';
  end if;

  insert into public.founders (user_id, is_founder, is_owner, display_label, created_by)
  values (v_actor, true, true, coalesce(nullif(trim(p_display_label), ''), 'Founder / Owner'), v_actor)
  on conflict (user_id) do update
  set is_founder = true, is_owner = true,
      display_label = coalesce(excluded.display_label, public.founders.display_label)
  returning * into v_row;

  insert into public.user_roles (user_id, role_id)
  select v_actor, r.id from public.roles r
  where r.code in ('founder', 'super_administrator')
  on conflict do nothing;

  update public.profiles
  set account_kind = 'founder', updated_at = timezone('utc', now())
  where id = v_actor;

  update public.founder_bootstrap_state
  set completed_at = timezone('utc', now()), completed_by = v_actor,
      notes = 'First Founder/Owner bootstrap — permanently locked'
  where id = 1;

  perform public.record_user_activity(
    v_actor, 'founder_bootstrap', 'Founder Owner criado',
    'Bootstrap institucional Kuteka', 'founder', v_actor::text, '{}'::jsonb
  );

  perform public.write_audit_event(
    'founder.bootstrap', 'founder', v_actor::text,
    jsonb_build_object('label', v_row.display_label),
    'Bootstrap do primeiro Founder/Owner — mecanismo bloqueado a partir de agora',
    null, to_jsonb(v_row), null, null
  );

  return v_row;
end;
$$;

revoke all on function public.founder_bootstrap_claim(text) from public;
grant execute on function public.founder_bootstrap_claim(text) to authenticated;

-- When promoting founder/co_founder, ensure founder/co_founder role codes
create or replace function public.founder_promote_user(
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
  if v_actor is null then raise exception 'authentication required'; end if;
  if not (public.is_platform_owner(v_actor) or public.is_founder(v_actor)) then
    raise exception 'founder required';
  end if;
  if p_reason is null or char_length(trim(p_reason)) < 3 then
    raise exception 'reason required';
  end if;
  if p_target_role not in (
    'founder', 'co_founder', 'super_administrator', 'administrator', 'supervisor', 'auditor'
  ) then
    raise exception 'invalid target role';
  end if;
  if p_target_role = 'founder' and not public.is_platform_owner(v_actor) then
    raise exception 'only platform owner can promote founders';
  end if;
  if exists (
    select 1 from auth.users u where u.id = p_user_id and u.email ilike 'demo.%@kuteka.local'
  ) then
    raise exception 'cannot promote system demo accounts';
  end if;

  select coalesce(array_agg(r.code order by r.code), '{}') into v_before
  from public.user_roles ur join public.roles r on r.id = ur.role_id
  where ur.user_id = p_user_id;

  if p_target_role = 'founder' then
    insert into public.founders (user_id, is_founder, is_owner, display_label, created_by)
    values (p_user_id, true, false, 'Founder', v_actor)
    on conflict (user_id) do update set is_founder = true;
    insert into public.user_roles (user_id, role_id, assigned_by)
    select p_user_id, r.id, v_actor from public.roles r
    where r.code in ('founder', 'super_administrator')
    on conflict do nothing;
  elsif p_target_role = 'co_founder' then
    insert into public.founders (user_id, is_founder, is_owner, display_label, created_by)
    values (p_user_id, true, false, 'Co-Founder', v_actor)
    on conflict (user_id) do update set is_founder = true, display_label = 'Co-Founder';
    insert into public.user_roles (user_id, role_id, assigned_by)
    select p_user_id, r.id, v_actor from public.roles r
    where r.code in ('co_founder', 'super_administrator')
    on conflict do nothing;
  else
    select id into v_role_id from public.roles where code = p_target_role;
    if v_role_id is null then raise exception 'role missing in catalog'; end if;
    insert into public.user_roles (user_id, role_id, assigned_by)
    values (p_user_id, v_role_id, v_actor)
    on conflict do nothing;
  end if;

  select coalesce(array_agg(r.code order by r.code), '{}') into v_after
  from public.user_roles ur join public.roles r on r.id = ur.role_id
  where ur.user_id = p_user_id;

  perform public.record_user_activity(
    p_user_id, 'role_promoted', 'Papel institucional actualizado',
    p_target_role, 'user', p_user_id::text,
    jsonb_build_object('by', v_actor, 'reason', p_reason)
  );

  perform public.write_audit_event(
    'institutional.promote',
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

revoke all on function public.founder_promote_user(uuid, text, text) from public;
grant execute on function public.founder_promote_user(uuid, text, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Operational escalations — Supervisor → Admin → Super → Founder
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.operational_escalations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users (id),
  created_by_role text not null,
  target_level text not null
    check (target_level in ('administrator', 'super_administrator', 'founder')),
  assignee_id uuid references auth.users (id),
  property_id uuid references public.properties (id) on delete set null,
  review_id uuid,
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'critical')),
  reason text not null,
  status text not null default 'open'
    check (status in ('open', 'acknowledged', 'resolved', 'cancelled')),
  due_at timestamptz,
  resolved_by uuid references auth.users (id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists operational_escalations_status_idx
  on public.operational_escalations (status, created_at desc);
create index if not exists operational_escalations_assignee_idx
  on public.operational_escalations (assignee_id, status);

drop trigger if exists operational_escalations_set_updated_at on public.operational_escalations;
create trigger operational_escalations_set_updated_at
before update on public.operational_escalations
for each row execute function public.set_updated_at();

alter table public.operational_escalations enable row level security;

drop policy if exists operational_escalations_select on public.operational_escalations;
create policy operational_escalations_select
  on public.operational_escalations for select to authenticated
  using (
    created_by = auth.uid()
    or assignee_id = auth.uid()
    or public.user_has_founder_or_permission(auth.uid(), 'properties.review')
    or public.user_has_permission(auth.uid(), 'admin.panel')
    or public.is_founder(auth.uid())
  );

revoke insert, update, delete on public.operational_escalations from anon, authenticated;
grant select on public.operational_escalations to authenticated;

create or replace function public.create_operational_escalation(
  p_target_level text,
  p_reason text,
  p_priority text default 'normal',
  p_property_id uuid default null,
  p_review_id uuid default null,
  p_due_hours int default 12
)
returns public.operational_escalations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_roles text[];
  v_from text;
  v_row public.operational_escalations;
begin
  if v_actor is null then raise exception 'authentication required'; end if;
  if p_reason is null or char_length(trim(p_reason)) < 5 then
    raise exception 'reason required';
  end if;
  if p_target_level not in ('administrator', 'super_administrator', 'founder') then
    raise exception 'invalid target level';
  end if;
  if coalesce(p_priority, 'normal') not in ('low', 'normal', 'high', 'critical') then
    raise exception 'invalid priority';
  end if;

  if not (
    public.user_has_founder_or_permission(v_actor, 'properties.review')
    or public.user_has_permission(v_actor, 'admin.panel')
    or public.is_founder(v_actor)
  ) then
    raise exception 'properties.review required';
  end if;

  select coalesce(array_agg(r.code order by r.code), '{}') into v_roles
  from public.user_roles ur join public.roles r on r.id = ur.role_id
  where ur.user_id = v_actor;

  v_from := case
    when 'supervisor' = any (v_roles) and not ('administrator' = any (v_roles)) then 'supervisor'
    when 'administrator' = any (v_roles) and not ('super_administrator' = any (v_roles)) then 'administrator'
    when 'super_administrator' = any (v_roles) then 'super_administrator'
    when public.is_founder(v_actor) then 'founder'
    else 'operator'
  end;

  -- Escalation ladder: cannot escalate "down"
  if v_from = 'supervisor' and p_target_level not in ('administrator', 'super_administrator', 'founder') then
    raise exception 'invalid escalation path';
  end if;

  insert into public.operational_escalations (
    created_by, created_by_role, target_level, property_id, review_id,
    priority, reason, due_at
  ) values (
    v_actor, v_from, p_target_level, p_property_id, p_review_id,
    coalesce(p_priority, 'normal'), trim(p_reason),
    timezone('utc', now()) + make_interval(hours => greatest(1, least(coalesce(p_due_hours, 12), 168)))
  )
  returning * into v_row;

  perform public.write_audit_event(
    'escalation.create',
    'operational_escalation',
    v_row.id::text,
    jsonb_build_object(
      'from', v_from,
      'to', p_target_level,
      'priority', v_row.priority,
      'propertyId', p_property_id
    ),
    trim(p_reason),
    null,
    to_jsonb(v_row),
    null,
    null
  );

  return v_row;
end;
$$;

revoke all on function public.create_operational_escalation(text, text, text, uuid, uuid, int) from public;
grant execute on function public.create_operational_escalation(text, text, text, uuid, uuid, int) to authenticated;

create or replace function public.list_operational_escalations(p_limit int default 50)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'authentication required'; end if;
  if not (
    public.user_has_founder_or_permission(v_actor, 'properties.review')
    or public.user_has_permission(v_actor, 'admin.panel')
    or public.is_founder(v_actor)
  ) then
    raise exception 'properties.review required';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.created_at desc)
    from (
      select
        e.id,
        e.created_by,
        e.created_by_role,
        e.target_level,
        e.assignee_id,
        e.property_id,
        e.review_id,
        e.priority,
        e.reason,
        e.status,
        e.due_at,
        e.resolved_by,
        e.resolved_at,
        e.resolution_notes,
        e.created_at,
        cp.display_name as created_by_name,
        p.title as property_title
      from public.operational_escalations e
      left join public.profiles cp on cp.id = e.created_by
      left join public.properties p on p.id = e.property_id
      where e.status in ('open', 'acknowledged')
         or e.created_at > timezone('utc', now()) - interval '14 days'
      order by e.created_at desc
      limit greatest(1, least(coalesce(p_limit, 50), 100))
    ) t
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.list_operational_escalations(int) from public;
grant execute on function public.list_operational_escalations(int) to authenticated;

create or replace function public.resolve_operational_escalation(
  p_escalation_id uuid,
  p_status text,
  p_resolution_notes text default null
)
returns public.operational_escalations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_before jsonb;
  v_row public.operational_escalations;
begin
  if v_actor is null then raise exception 'authentication required'; end if;
  if p_status not in ('acknowledged', 'resolved', 'cancelled') then
    raise exception 'invalid status';
  end if;
  if not (
    public.user_has_founder_or_permission(v_actor, 'properties.review')
    or public.user_has_permission(v_actor, 'admin.panel')
    or public.is_founder(v_actor)
  ) then
    raise exception 'properties.review required';
  end if;

  select to_jsonb(e) into v_before
  from public.operational_escalations e where e.id = p_escalation_id;
  if v_before is null then raise exception 'escalation not found'; end if;

  update public.operational_escalations
  set
    status = p_status,
    assignee_id = coalesce(assignee_id, v_actor),
    resolved_by = case when p_status in ('resolved', 'cancelled') then v_actor else resolved_by end,
    resolved_at = case when p_status in ('resolved', 'cancelled') then timezone('utc', now()) else resolved_at end,
    resolution_notes = coalesce(nullif(trim(p_resolution_notes), ''), resolution_notes),
    updated_at = timezone('utc', now())
  where id = p_escalation_id
  returning * into v_row;

  perform public.write_audit_event(
    'escalation.' || p_status,
    'operational_escalation',
    p_escalation_id::text,
    jsonb_build_object('status', p_status),
    coalesce(nullif(trim(p_resolution_notes), ''), 'Actualização de escalação'),
    v_before,
    to_jsonb(v_row),
    null,
    null
  );

  return v_row;
end;
$$;

revoke all on function public.resolve_operational_escalation(uuid, text, text) from public;
grant execute on function public.resolve_operational_escalation(uuid, text, text) to authenticated;
