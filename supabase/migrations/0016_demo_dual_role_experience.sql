-- Demo account with both Client + Patrimonial Partner roles
-- for testing "Mudar de papel" / integrated experience.

create or replace function public.seed_demo_dual_role()
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_dual uuid := 'a0000000-0000-4000-8000-0000000000f1';
  v_role uuid;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_dual, 'authenticated', 'authenticated',
    'demo.dual@kuteka.local', crypt('DemoKuteka2026!', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Demo Cliente + Parceiro"}'::jsonb,
    timezone('utc', now()), timezone('utc', now()), '', '', '', ''
  ) on conflict (id) do nothing;

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) values (
    v_dual, v_dual,
    jsonb_build_object('sub', v_dual::text, 'email', 'demo.dual@kuteka.local'),
    'email', v_dual::text, timezone('utc', now()), timezone('utc', now()), timezone('utc', now())
  ) on conflict do nothing;

  update public.profiles
  set display_name = 'Demo Cliente + Parceiro', updated_by = v_dual
  where id = v_dual;

  select id into v_role from public.roles where code = 'client';
  if v_role is not null then
    insert into public.user_roles (user_id, role_id, assigned_by)
    values (v_dual, v_role, v_dual)
    on conflict do nothing;
  end if;

  select id into v_role from public.roles where code = 'patrimonial_partner';
  if v_role is not null then
    insert into public.user_roles (user_id, role_id, assigned_by)
    values (v_dual, v_role, v_dual)
    on conflict do nothing;
  end if;
end;
$$;

revoke all on function public.seed_demo_dual_role() from public;
grant execute on function public.seed_demo_dual_role() to authenticated;

select public.seed_demo_dual_role();
