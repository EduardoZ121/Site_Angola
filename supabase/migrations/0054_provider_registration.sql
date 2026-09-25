-- Registo de prestador: o dono vê o próprio pedido pendente.
-- Quem tem admin ou financeiro vê a fila, mesmo inactiva.
-- Activar a empresa também dá o papel service_provider ao responsável.

drop policy if exists service_providers_select on public.service_providers;
create policy service_providers_select
  on public.service_providers for select to authenticated
  using (
    deleted_at is null
    and (
      active = true
      or user_id = auth.uid()
      or public.user_has_permission(auth.uid(), 'finance.manage')
      or public.user_has_permission(auth.uid(), 'admin.panel')
    )
  );

create or replace function public.activate_service_provider(p_id uuid, p_active boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_owner uuid;
  v_role uuid;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if not (
    public.user_has_permission(v_actor, 'finance.manage')
    or public.user_has_permission(v_actor, 'admin.panel')
    or public.is_founder(v_actor)
  ) then
    raise exception 'not allowed to activate provider';
  end if;

  select user_id into v_owner
  from public.service_providers
  where id = p_id and deleted_at is null;

  if v_owner is null then
    raise exception 'provider not found';
  end if;

  update public.service_providers
  set active = coalesce(p_active, false),
      updated_at = timezone('utc', now())
  where id = p_id;

  if coalesce(p_active, false) then
    select id into v_role from public.roles where code = 'service_provider' and deleted_at is null;
    if v_role is not null then
      insert into public.user_roles (user_id, role_id, assigned_by)
      values (v_owner, v_role, v_actor)
      on conflict (user_id, role_id) do nothing;
    end if;
  end if;

  perform public.write_audit_event(
    'provider.activation',
    'service_provider',
    p_id::text,
    jsonb_build_object('active', coalesce(p_active, false), 'owner', v_owner)
  );

  return jsonb_build_object('ok', true, 'active', coalesce(p_active, false), 'owner', v_owner);
end;
$$;

revoke all on function public.activate_service_provider(uuid, boolean) from public;
grant execute on function public.activate_service_provider(uuid, boolean) to authenticated;
