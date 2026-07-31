-- PRD-001 §16.5: activate self-serve roles (client / patrimonial_partner only)
-- Idempotent insert into user_roles; audit via write_audit_log.

create or replace function public.activate_self_serve_roles(p_role_codes text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_role_id uuid;
  v_allowed constant text[] := array['client', 'patrimonial_partner'];
  v_inserted text[] := '{}'::text[];
  v_normalized text[];
  v_rowcount int;
begin
  if v_uid is null then
    raise exception 'authentication required';
  end if;

  if p_role_codes is null or cardinality(p_role_codes) = 0 then
    raise exception 'at least one role code is required';
  end if;

  -- Dedupe + lowercase trim
  select coalesce(array_agg(distinct lower(trim(c))), '{}'::text[])
  into v_normalized
  from unnest(p_role_codes) as c
  where length(trim(c)) > 0;

  if v_normalized is null or cardinality(v_normalized) = 0 then
    raise exception 'at least one role code is required';
  end if;

  foreach v_code in array v_normalized
  loop
    if not (v_code = any (v_allowed)) then
      raise exception 'role code not allowed for self-serve: %', v_code;
    end if;

    select r.id into v_role_id
    from public.roles r
    where r.code = v_code
      and r.deleted_at is null;

    if v_role_id is null then
      raise exception 'unknown role code: %', v_code;
    end if;

    insert into public.user_roles (user_id, role_id, assigned_by)
    values (v_uid, v_role_id, v_uid)
    on conflict (user_id, role_id) do nothing;

    get diagnostics v_rowcount = row_count;
    if v_rowcount > 0 then
      v_inserted := array_append(v_inserted, v_code);
    end if;
  end loop;

  -- Audit only when at least one new assignment was created (L6.9 — no spurious audits)
  if cardinality(v_inserted) > 0 then
    perform public.write_audit_log(
      'auth.role_activated',
      'user_roles',
      v_uid::text,
      jsonb_build_object('roles', to_jsonb(v_inserted))
    );
  end if;
end;
$$;

revoke all on function public.activate_self_serve_roles(text[]) from public;
grant execute on function public.activate_self_serve_roles(text[]) to authenticated;

comment on function public.activate_self_serve_roles(text[]) is
  'PRD-001 §16.5: Self-serve activation of client and/or patrimonial_partner. Rejects agent/admin. Idempotent.';
