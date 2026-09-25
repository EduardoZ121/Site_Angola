-- Kuteka: aplicar de uma vez as migrações 0052 a 0059.
-- Supabase → SQL Editor → colar este ficheiro → Run.
-- Não volta a correr 0001–0051. Essas já estão na base.


-- ========== 0052_accountant_role.sql ==========
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


-- ========== 0053_notification_states.sql ==========
-- Estados do sino: lida (read_at), arquivada (archived_at), acção (metadata.action).
-- Não apaga notificações. O contador da interface só conta não lidas.

alter table public.user_notifications
  add column if not exists archived_at timestamptz;

create or replace function public.archive_my_notifications(p_ids uuid[])
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if p_ids is null or cardinality(p_ids) = 0 then
    return 0;
  end if;
  update public.user_notifications
  set archived_at = timezone('utc', now()),
      read_at = coalesce(read_at, timezone('utc', now()))
  where user_id = auth.uid()
    and archived_at is null
    and id = any (p_ids);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.archive_my_notifications(uuid[]) from public;
grant execute on function public.archive_my_notifications(uuid[]) to authenticated;


-- ========== 0054_provider_registration.sql ==========
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


-- ========== 0055_demo_showcase_publications.sql ==========
-- Publicações Demo visíveis no mercado, marcadas como demonstração.
-- Um administrador retira-as uma a uma. Não passam a oferta real.

create or replace function public.property_is_publicly_visible(p public.properties)
returns boolean
language sql
stable
as $$
  select
    p.deleted_at is null
    and p.status = 'active'
    and coalesce(p.review_status, 'approved') = 'approved'
    and (
      p.is_demo = true
      or p.premium_visible_at is null
      or p.premium_visible_at <= timezone('utc', now())
    )
    and (
      p.is_demo = true
      or coalesce(p.lifecycle_status, 'publicado') in (
        'publicado',
        'janela_premium',
        'em_negociacao',
        'disponivel_novamente',
        'libertacao_prevista',
        'temporariamente_indisponivel',
        'em_manutencao'
      )
      or (
        p.expected_available_on is not null
        and p.expected_available_on >= current_date
      )
    );
$$;

create or replace function public.retire_demo_publication(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_code text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if not (
    public.user_has_permission(v_actor, 'admin.panel')
    or public.is_founder(v_actor)
  ) then
    raise exception 'admin required to retire demo publication';
  end if;

  update public.properties
  set deleted_at = timezone('utc', now()),
      status = 'archived'
  where id = p_id
    and coalesce(is_demo, false) = true
    and deleted_at is null
  returning code into v_code;

  if v_code is null then
    raise exception 'demo publication not found';
  end if;

  perform public.write_audit_event(
    'property.demo_retired',
    'property',
    p_id::text,
    jsonb_build_object('code', v_code)
  );

  return jsonb_build_object('ok', true, 'code', v_code);
end;
$$;

revoke all on function public.retire_demo_publication(uuid) from public;
grant execute on function public.retire_demo_publication(uuid) to authenticated;


-- ========== 0056_feedback_ack_and_visit_request.sql ==========
-- Aviso ao autor quando o relato fecha (BETA-23) e pedido de visita no interesse já existente.
-- Não cria calendário novo nem segundo sistema de tickets.

alter table public.property_interests
  add column if not exists visit_on date,
  add column if not exists visit_window text;

alter table public.property_interests
  drop constraint if exists property_interests_visit_window_check;

alter table public.property_interests
  add constraint property_interests_visit_window_check
  check (visit_window is null or visit_window in ('manha', 'tarde', 'qualquer'));

create or replace function public.request_property_visit(
  p_property_id uuid,
  p_visit_on date,
  p_window text default 'qualquer'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_window text := coalesce(nullif(trim(p_window), ''), 'qualquer');
  v_note text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if p_visit_on is null then
    raise exception 'visit date required';
  end if;
  if v_window not in ('manha', 'tarde', 'qualquer') then
    raise exception 'invalid visit window';
  end if;

  v_note := 'Pedido de visita: ' || p_visit_on::text || ' · ' ||
    case v_window
      when 'manha' then 'manhã'
      when 'tarde' then 'tarde'
      else 'qualquer hora'
    end;

  v_id := public.express_property_interest(p_property_id, v_note);

  update public.property_interests
  set visit_on = p_visit_on,
      visit_window = v_window,
      notes = v_note
  where id = v_id;

  return v_id;
end;
$$;

revoke all on function public.request_property_visit(uuid, date, text) from public;
grant execute on function public.request_property_visit(uuid, date, text) to authenticated;

create or replace function public.kocc_update_beta_feedback_status(
  p_id uuid,
  p_status text,
  p_resolution_notes text default null
)
returns public.beta_feedback
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_before public.beta_feedback;
  v_row public.beta_feedback;
  v_title text;
  v_body text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if not (
    public.user_has_founder_or_permission(v_actor, 'finance.manage')
    or public.user_has_permission(v_actor, 'admin.panel')
  ) then
    raise exception 'ops permission required';
  end if;
  if p_status is null or p_status not in (
    'received', 'em_analise', 'classificado', 'em_desenvolvimento',
    'resolvido', 'duplicado', 'nao_reproduzivel'
  ) then
    raise exception 'invalid status';
  end if;

  select * into v_before from public.beta_feedback where id = p_id;
  if not found then
    raise exception 'feedback not found';
  end if;

  update public.beta_feedback
  set
    status = p_status,
    status_updated_at = timezone('utc', now()),
    status_updated_by = v_actor,
    resolution_notes = case
      when p_resolution_notes is null then resolution_notes
      else nullif(trim(p_resolution_notes), '')
    end
  where id = p_id
  returning * into v_row;

  perform public.write_audit_event(
    'beta_feedback.status_update',
    'beta_feedback',
    v_row.id::text,
    jsonb_build_object(
      'from', v_before.status,
      'to', v_row.status,
      'kind', v_row.kind
    ),
    nullif(trim(coalesce(p_resolution_notes, '')), ''),
    jsonb_build_object('status', v_before.status),
    jsonb_build_object('status', v_row.status),
    null,
    null
  );

  if v_row.actor_id is not null
     and v_before.status is distinct from v_row.status
     and v_row.status in ('resolvido', 'duplicado', 'nao_reproduzivel') then
    v_title := case v_row.status
      when 'resolvido' then 'O seu relato foi tratado'
      when 'duplicado' then 'O seu relato já estava registado'
      else 'Não foi possível reproduzir o relato'
    end;
    v_body := coalesce(
      nullif(trim(coalesce(v_row.resolution_notes, '')), ''),
      'A operação fechou o relato. Não há resposta automática além deste aviso.'
    );
    perform public.notify_user(
      v_row.actor_id,
      'beta_feedback',
      v_title,
      v_body,
      '/app/ajuda',
      jsonb_build_object('feedback_id', v_row.id, 'status', v_row.status)
    );
  end if;

  return v_row;
end;
$$;

revoke all on function public.kocc_update_beta_feedback_status(uuid, text, text) from public;
grant execute on function public.kocc_update_beta_feedback_status(uuid, text, text) to authenticated;


-- ========== 0057_revoke_operational_task.sql ==========
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


-- ========== 0058_operational_task_end.sql ==========
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


-- ========== 0059_opening_settings.sql ==========
-- Abertura regulável pelo Founder, contabilista e administradores.
-- Não cria cobrança nova. Só permite ligar ou desligar o que já existe.

insert into public.platform_feature_flags (code, label, description, enabled) values
  ('payments_open', 'Cobrança', 'Abre o pagamento que já existe. Fechado, ninguém cobra.', false),
  ('visits_open', 'Pedidos de visita', 'O cliente pode indicar o dia da visita.', true),
  ('reviews_open', 'Avaliações', 'Quem teve contrato concluído pode avaliar.', true),
  ('providers_open', 'Registo de prestadores', 'Uma empresa pode pedir para entrar. A aprovação continua.', true),
  ('publications_open', 'Registo de imóveis', 'O parceiro pode registar imóvel, mesmo ainda indisponível.', true)
on conflict (code) do nothing;

create or replace function public.can_regulate_opening(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user_id is not null and (
    public.user_has_permission(p_user_id, 'finance.manage')
    or public.user_has_permission(p_user_id, 'founder.manage')
    or public.user_has_permission(p_user_id, 'admin.panel')
    or exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = p_user_id
        and r.code in ('founder', 'co_founder', 'super_administrator', 'administrator', 'accountant')
    )
  );
$$;

revoke all on function public.can_regulate_opening(uuid) from public;
grant execute on function public.can_regulate_opening(uuid) to authenticated;

drop policy if exists platform_feature_flags_write on public.platform_feature_flags;
create policy platform_feature_flags_write
  on public.platform_feature_flags for all to authenticated
  using (public.can_regulate_opening(auth.uid()))
  with check (public.can_regulate_opening(auth.uid()));

create or replace function public.set_feature_flag(p_code text, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.can_regulate_opening(v_actor) then
    raise exception 'opening regulation required';
  end if;
  insert into public.platform_feature_flags (code, label, description, enabled, updated_by)
  values (p_code, p_code, '', p_enabled, v_actor)
  on conflict (code) do update
    set enabled = excluded.enabled,
        updated_at = timezone('utc', now()),
        updated_by = v_actor;
  perform public.write_audit_log(
    'feature_flag.updated',
    'platform_feature_flag',
    p_code,
    jsonb_build_object('enabled', p_enabled)
  );
end;
$$;

