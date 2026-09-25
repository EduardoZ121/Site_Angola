-- Data de fim de uma tarefa já passada. Não retira o cargo sozinha e não apaga o rasto.

create table if not exists public.operational_task_terms (
  user_id uuid not null references auth.users (id) on delete cascade,
  role_code text not null
    check (role_code in ('super_administrator', 'administrator', 'supervisor', 'accountant')),
  ends_on date,
  set_by uuid not null references auth.users (id),
  reason text,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, role_code)
);

alter table public.operational_task_terms enable row level security;

revoke all on public.operational_task_terms from public, anon, authenticated;

create or replace function public.founder_set_operational_task_end(
  p_user_id uuid,
  p_target_role text,
  p_ends_on date,
  p_reason text
)
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
  if not (public.is_platform_owner(v_actor) or public.is_founder(v_actor)) then
    raise exception 'founder required';
  end if;
  if p_reason is null or char_length(trim(p_reason)) < 3 then
    raise exception 'reason required';
  end if;
  if p_target_role not in ('super_administrator', 'administrator', 'supervisor', 'accountant') then
    raise exception 'invalid task';
  end if;
  if p_ends_on is null then
    raise exception 'end date required';
  end if;
  if not exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = p_user_id
      and r.code = p_target_role
  ) then
    raise exception 'task not assigned';
  end if;

  insert into public.operational_task_terms (user_id, role_code, ends_on, set_by, reason, updated_at)
  values (p_user_id, p_target_role, p_ends_on, v_actor, trim(p_reason), timezone('utc', now()))
  on conflict (user_id, role_code) do update
  set ends_on = excluded.ends_on,
      set_by = excluded.set_by,
      reason = excluded.reason,
      updated_at = timezone('utc', now());

  perform public.write_audit_event(
    'institutional.task_end',
    'user',
    p_user_id::text,
    jsonb_build_object('targetRole', p_target_role, 'endsOn', p_ends_on),
    trim(p_reason),
    null,
    jsonb_build_object('endsOn', p_ends_on),
    null,
    null
  );

  return jsonb_build_object('userId', p_user_id, 'targetRole', p_target_role, 'endsOn', p_ends_on);
end;
$$;

revoke all on function public.founder_set_operational_task_end(uuid, text, date, text) from public;
grant execute on function public.founder_set_operational_task_end(uuid, text, date, text) to authenticated;

create or replace function public.list_operational_task_terms()
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
  if not (
    public.is_platform_owner(v_actor)
    or public.is_founder(v_actor)
    or public.user_has_permission(v_actor, 'admin.panel')
  ) then
    raise exception 'not allowed';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'userId', t.user_id,
      'role', t.role_code,
      'endsOn', t.ends_on
    ))
    from public.operational_task_terms t
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.list_operational_task_terms() from public;
grant execute on function public.list_operational_task_terms() to authenticated;
