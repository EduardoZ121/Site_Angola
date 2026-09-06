-- Beta interna testável (KUT-REQ-005 / KUT-REQ-006)
-- Guards only. No drops. No commission / RBAC / founder identity changes.
-- D3 demo isolation is enforced in the housing client (data preserved).

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Pay — default gateway locked to sandbox (adapters remain in table)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.kuteka_pay_set_default_gateway(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_code text := lower(trim(coalesce(p_code, '')));
begin
  if v_actor is null or not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'finance.manage required';
  end if;

  if v_code is distinct from 'sandbox' then
    raise exception 'beta sandbox only: default gateway must remain sandbox';
  end if;

  select id into v_id
  from public.finance_gateways
  where code = v_code and deleted_at is null;
  if not found then
    raise exception 'gateway % not found', p_code;
  end if;

  update public.finance_gateways set is_default = false where is_default;
  update public.finance_gateways
  set is_default = true, active = true, updated_by = v_actor
  where id = v_id;

  perform public.write_audit_log(
    'kuteka_pay.default_gateway_set',
    'finance_gateway',
    v_id::text,
    jsonb_build_object('code', v_code, 'betaLock', true)
  );

  return jsonb_build_object('ok', true, 'gatewayCode', v_code);
end;
$$;

revoke all on function public.kuteka_pay_set_default_gateway(text) from public;
grant execute on function public.kuteka_pay_set_default_gateway(text) to authenticated;

update public.finance_gateways
set is_default = (code = 'sandbox')
where deleted_at is null;

comment on function public.kuteka_pay_set_default_gateway(text) is
  'Beta lock: only sandbox may be the default gateway. Other adapter rows are preserved.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Email-change — prepared (0038) but not activated (D5)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.request_email_change(p_new_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  raise exception 'email change is prepared but not activated (D5)';
end;
$$;

create or replace function public.confirm_email_change(
  p_request_id uuid,
  p_old_code text,
  p_new_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  raise exception 'email change is prepared but not activated (D5)';
end;
$$;

revoke all on function public.request_email_change(text) from public;
grant execute on function public.request_email_change(text) to authenticated;
revoke all on function public.confirm_email_change(uuid, text, text) from public;
grant execute on function public.confirm_email_change(uuid, text, text) to authenticated;

comment on function public.request_email_change(text) is
  'D5: flow prepared in 0038, not activated. Table email_change_requests preserved.';
comment on function public.confirm_email_change(uuid, text, text) is
  'D5: flow prepared in 0038, not activated. Do not drop this function.';
