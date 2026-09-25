-- Contabilista: papel de leitura financeira. Não gere Founder, flags, auditoria nem dinheiro.

insert into public.roles (code, name, description, is_system)
values (
  'accountant',
  'Contabilista',
  'Lê o financeiro, prepara o fecho e comenta documentos. Não promove pessoas nem movimenta dinheiro.',
  true
)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    is_system = true,
    updated_at = timezone('utc', now());

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code in ('platform.access', 'finance.read')
where r.code = 'accountant'
on conflict do nothing;

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
    'founder', 'co_founder', 'super_administrator', 'administrator', 'supervisor', 'auditor', 'accountant'
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

create table if not exists public.institutional_document_reviews (
  id uuid primary key default gen_random_uuid(),
  doc_code text not null,
  audience text not null check (audience in ('accountant', 'lawyer')),
  decision text not null check (decision in ('approved', 'changes_requested')),
  notes text,
  reviewed_by uuid not null references auth.users (id),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.institutional_document_reviews enable row level security;

drop policy if exists institutional_reviews_select on public.institutional_document_reviews;
create policy institutional_reviews_select
  on public.institutional_document_reviews for select to authenticated
  using (
    public.user_has_permission(auth.uid(), 'finance.read')
    or public.user_has_permission(auth.uid(), 'founder.manage')
    or public.is_founder(auth.uid())
  );

drop policy if exists institutional_reviews_insert on public.institutional_document_reviews;
create policy institutional_reviews_insert
  on public.institutional_document_reviews for insert to authenticated
  with check (
    reviewed_by = auth.uid()
    and (
      public.user_has_permission(auth.uid(), 'finance.read')
      or public.is_founder(auth.uid())
    )
  );

create or replace function public.record_document_review(
  p_doc_code text,
  p_audience text,
  p_decision text,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
begin
  if v_actor is null then raise exception 'authentication required'; end if;
  if not (
    public.user_has_permission(v_actor, 'finance.read')
    or public.is_founder(v_actor)
  ) then
    raise exception 'not allowed';
  end if;
  if p_audience not in ('accountant', 'lawyer') then raise exception 'invalid audience'; end if;
  if p_decision not in ('approved', 'changes_requested') then raise exception 'invalid decision'; end if;
  insert into public.institutional_document_reviews (doc_code, audience, decision, notes, reviewed_by)
  values (trim(p_doc_code), p_audience, p_decision, nullif(trim(p_notes), ''), v_actor)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.record_document_review(text, text, text, text) from public;
grant execute on function public.record_document_review(text, text, text, text) to authenticated;
