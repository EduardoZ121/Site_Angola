-- 0037_four_pillars_governance.sql
-- Sprint Beta 1.6 — quatro pilares (sem novos módulos de produto):
-- 1) Audit Center  2) Moderação  3) Reputação global  4) Timeline + KOS Analytics
-- Arquitectura reservada: Conselho Kuteka (papéis futuros).

-- ═══════════════════════════════════════════════════════════════════════════
-- 0. Reserved governance roles (architecture only — minimal permissions)
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.roles (code, name, description, is_system)
values
  ('co_founder', 'Co-Founder', 'Co-fundador — governação partilhada (reservado)', true),
  ('board_member', 'Board Member', 'Conselho Kuteka — supervisão estratégica (reservado)', true),
  ('investor_readonly', 'Investor (Read Only)', 'Investidor — leitura de indicadores (reservado)', true),
  ('auditor', 'Auditor', 'Auditoria independente (reservado)', true),
  ('supervisor', 'Supervisor', 'Supervisão operacional intermédia (reservado)', true)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  is_system = true,
  updated_at = timezone('utc', now());

insert into public.permissions (code, description)
values
  ('audit.read', 'Ler o Audit Center da plataforma'),
  ('moderation.manage', 'Gerir denúncias e moderação de conteúdo')
on conflict (code) do update
set description = excluded.description,
    updated_at = timezone('utc', now());

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code in ('administrator', 'super_administrator', 'auditor')
  and p.code in ('audit.read', 'moderation.manage')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'platform.access'
where r.code in ('co_founder', 'board_member', 'investor_readonly', 'auditor', 'supervisor')
on conflict do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Audit Center — enrich audit_logs + list RPC
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.audit_logs
  add column if not exists reason text,
  add column if not exists ip inet,
  add column if not exists user_agent text,
  add column if not exists before_state jsonb,
  add column if not exists after_state jsonb,
  add column if not exists actor_roles text[] not null default '{}';

comment on column public.audit_logs.reason is
  'Motivo obrigatório para acções críticas (aprovação, comissão, founders, papéis).';

create or replace function public.write_audit_event(
  p_action text,
  p_entity_type text default null,
  p_entity_id text default null,
  p_metadata jsonb default null,
  p_reason text default null,
  p_before jsonb default null,
  p_after jsonb default null,
  p_ip text default null,
  p_user_agent text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_actor uuid := auth.uid();
  v_roles text[];
  v_ip inet;
begin
  if p_action is null or length(trim(p_action)) = 0 then
    raise exception 'audit action is required';
  end if;

  select coalesce(array_agg(r.code order by r.code), '{}')
  into v_roles
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = v_actor;

  begin
    v_ip := nullif(trim(p_ip), '')::inet;
  exception when others then
    v_ip := null;
  end;

  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, metadata,
    reason, ip, user_agent, before_state, after_state, actor_roles
  )
  values (
    v_actor,
    trim(p_action),
    p_entity_type,
    p_entity_id,
    p_metadata,
    nullif(trim(p_reason), ''),
    v_ip,
    nullif(trim(p_user_agent), ''),
    p_before,
    p_after,
    coalesce(v_roles, '{}')
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.write_audit_event(text, text, text, jsonb, text, jsonb, jsonb, text, text) from public;
grant execute on function public.write_audit_event(text, text, text, jsonb, text, jsonb, jsonb, text, text)
  to authenticated, service_role;

-- Keep legacy write_audit_log as thin wrapper
create or replace function public.write_audit_log(
  p_action text,
  p_entity_type text default null,
  p_entity_id text default null,
  p_metadata jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.write_audit_event(
    p_action, p_entity_type, p_entity_id, p_metadata,
    null, null, null, null, null
  );
end;
$$;

create or replace function public.admin_list_audit_logs(
  p_limit int default 50,
  p_action_prefix text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null
     or not (
       public.user_has_founder_or_permission(v_actor, 'audit.read')
       or public.user_has_permission(v_actor, 'admin.panel')
       or public.user_has_permission(v_actor, 'finance.manage')
     ) then
    raise exception 'audit.read required';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.created_at desc)
    from (
      select
        a.id,
        a.actor_id,
        a.action,
        a.entity_type,
        a.entity_id,
        a.metadata,
        a.reason,
        host(a.ip) as ip,
        a.user_agent,
        a.before_state,
        a.after_state,
        a.actor_roles,
        a.created_at,
        p.display_name as actor_name
      from public.audit_logs a
      left join public.profiles p on p.id = a.actor_id
      where (
        p_action_prefix is null
        or a.action ilike (trim(p_action_prefix) || '%')
      )
      order by a.created_at desc
      limit greatest(1, least(coalesce(p_limit, 50), 200))
    ) t
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_list_audit_logs(int, text) from public;
grant execute on function public.admin_list_audit_logs(int, text) to authenticated;

-- Patch founder RPCs to write rich audit
create or replace function public.founder_link_user(
  p_user_id uuid,
  p_is_owner boolean default false,
  p_display_label text default null
)
returns public.founders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_before jsonb;
  v_row public.founders;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if not public.is_platform_owner(v_actor) then
    if exists (select 1 from public.founders where is_owner = true) then
      raise exception 'only platform owner can link founders';
    end if;
    if not public.user_has_permission(v_actor, 'finance.manage')
       and not public.is_founder(v_actor) then
      raise exception 'founder.manage bootstrap requires finance.manage or empty owners';
    end if;
  end if;

  select to_jsonb(f) into v_before from public.founders f where user_id = p_user_id;

  insert into public.founders (user_id, is_founder, is_owner, display_label, created_by)
  values (p_user_id, true, coalesce(p_is_owner, false), p_display_label, v_actor)
  on conflict (user_id) do update
  set
    is_founder = true,
    is_owner = excluded.is_owner or public.founders.is_owner,
    display_label = coalesce(excluded.display_label, public.founders.display_label)
  returning * into v_row;

  insert into public.user_roles (user_id, role_id)
  select p_user_id, r.id
  from public.roles r
  where r.code = 'super_administrator'
  on conflict do nothing;

  perform public.write_audit_event(
    'founder.link_user',
    'founder',
    p_user_id::text,
    jsonb_build_object('isOwner', v_row.is_owner, 'label', v_row.display_label),
    'Ligação de Founder/Owner',
    v_before,
    to_jsonb(v_row),
    null,
    null
  );

  return v_row;
end;
$$;

create or replace function public.founder_set_commission_param(
  p_code text,
  p_value_numeric numeric,
  p_notes text default null
)
returns public.platform_commission_params
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_before jsonb;
  v_row public.platform_commission_params;
begin
  if v_actor is null or not (
    public.is_platform_owner(v_actor) or public.is_founder(v_actor)
  ) then
    raise exception 'founder or owner required';
  end if;
  if p_value_numeric is null or p_value_numeric < 0 or p_value_numeric > 100 then
    raise exception 'value must be between 0 and 100';
  end if;

  select to_jsonb(c) into v_before
  from public.platform_commission_params c where code = p_code;

  update public.platform_commission_params
  set
    value_numeric = p_value_numeric,
    notes = coalesce(p_notes, notes),
    updated_at = timezone('utc', now()),
    updated_by = v_actor
  where code = p_code
  returning * into v_row;

  if v_row.code is null then
    raise exception 'unknown commission param';
  end if;

  perform public.write_audit_event(
    'founder.commission_param_set',
    'commission_param',
    p_code,
    jsonb_build_object('notes', p_notes),
    'Alteração de comissão de activação',
    v_before,
    to_jsonb(v_row),
    null,
    null
  );

  return v_row;
end;
$$;

-- Mirror KOCC flag updates into audit_logs (best-effort wrapper note in comment).
-- Existing kocc_upsert_flag already writes platform_feature_flag_audit.

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Moderation Center — content_reports
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  target_kind text not null check (target_kind in (
    'comment', 'question', 'chat_message', 'review', 'property', 'profile', 'other'
  )),
  target_id text not null,
  property_id uuid references public.properties (id) on delete set null,
  reason_code text not null check (reason_code in (
    'spam', 'offensive', 'fake_account', 'fraud_suspicion', 'abusive', 'other'
  )),
  details text,
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  reporter_id uuid references auth.users (id) on delete set null,
  resolved_by uuid references auth.users (id),
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists content_reports_status_idx
  on public.content_reports (status, created_at desc);

drop trigger if exists content_reports_set_updated_at on public.content_reports;
create trigger content_reports_set_updated_at
before update on public.content_reports
for each row execute function public.set_updated_at();

alter table public.content_reports enable row level security;

drop policy if exists content_reports_insert_own on public.content_reports;
create policy content_reports_insert_own
  on public.content_reports for insert to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists content_reports_select_ops on public.content_reports;
create policy content_reports_select_ops
  on public.content_reports for select to authenticated
  using (
    reporter_id = auth.uid()
    or public.user_has_founder_or_permission(auth.uid(), 'moderation.manage')
    or public.user_has_permission(auth.uid(), 'admin.panel')
  );

revoke update, delete on public.content_reports from anon, authenticated;
grant insert, select on public.content_reports to authenticated;
grant all on public.content_reports to service_role;

create or replace function public.submit_content_report(
  p_target_kind text,
  p_target_id text,
  p_reason_code text,
  p_details text default null,
  p_property_id uuid default null
)
returns public.content_reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_row public.content_reports;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  insert into public.content_reports (
    target_kind, target_id, reason_code, details, property_id, reporter_id
  ) values (
    p_target_kind, trim(p_target_id), p_reason_code,
    nullif(trim(p_details), ''), p_property_id, v_actor
  )
  returning * into v_row;

  perform public.write_audit_event(
    'moderation.report_submitted',
    p_target_kind,
    p_target_id,
    jsonb_build_object('reason', p_reason_code, 'reportId', v_row.id),
    null, null, to_jsonb(v_row), null, null
  );

  return v_row;
end;
$$;

revoke all on function public.submit_content_report(text, text, text, text, uuid) from public;
grant execute on function public.submit_content_report(text, text, text, text, uuid) to authenticated;

create or replace function public.admin_list_content_reports(p_limit int default 50)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
     or not (
       public.user_has_founder_or_permission(auth.uid(), 'moderation.manage')
       or public.user_has_permission(auth.uid(), 'admin.panel')
     ) then
    raise exception 'moderation.manage required';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.created_at desc)
    from (
      select *
      from public.content_reports
      where status in ('open', 'reviewing')
      order by created_at desc
      limit greatest(1, least(coalesce(p_limit, 50), 200))
    ) t
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_list_content_reports(int) from public;
grant execute on function public.admin_list_content_reports(int) to authenticated;

create or replace function public.admin_resolve_content_report(
  p_report_id uuid,
  p_status text,
  p_resolution_notes text default null
)
returns public.content_reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_before jsonb;
  v_row public.content_reports;
begin
  if v_actor is null
     or not (
       public.user_has_founder_or_permission(v_actor, 'moderation.manage')
       or public.user_has_permission(v_actor, 'admin.panel')
     ) then
    raise exception 'moderation.manage required';
  end if;
  if p_status not in ('resolved', 'dismissed', 'reviewing') then
    raise exception 'invalid status';
  end if;

  select to_jsonb(r) into v_before from public.content_reports r where id = p_report_id;

  update public.content_reports
  set
    status = p_status,
    resolution_notes = p_resolution_notes,
    resolved_by = case when p_status in ('resolved', 'dismissed') then v_actor else resolved_by end,
    resolved_at = case when p_status in ('resolved', 'dismissed') then timezone('utc', now()) else resolved_at end
  where id = p_report_id
  returning * into v_row;

  if v_row.id is null then
    raise exception 'report not found';
  end if;

  perform public.write_audit_event(
    'moderation.report_' || p_status,
    'content_report',
    p_report_id::text,
    null,
    coalesce(nullif(trim(p_resolution_notes), ''), 'Resolução de denúncia'),
    v_before,
    to_jsonb(v_row),
    null,
    null
  );

  return v_row;
end;
$$;

revoke all on function public.admin_resolve_content_report(uuid, text, text) from public;
grant execute on function public.admin_resolve_content_report(uuid, text, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Global timeline — user_activity_events + publication hooks
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.user_activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  title text not null,
  summary text,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_activity_events_user_idx
  on public.user_activity_events (user_id, occurred_at desc);

alter table public.user_activity_events enable row level security;

drop policy if exists user_activity_events_select on public.user_activity_events;
create policy user_activity_events_select
  on public.user_activity_events for select to authenticated
  using (
    user_id = auth.uid()
    or public.user_has_founder_or_permission(auth.uid(), 'audit.read')
    or public.user_has_permission(auth.uid(), 'admin.panel')
  );

revoke insert, update, delete on public.user_activity_events from anon, authenticated;
grant select on public.user_activity_events to authenticated;
grant all on public.user_activity_events to service_role;

create or replace function public.record_user_activity(
  p_user_id uuid,
  p_event_type text,
  p_title text,
  p_summary text default null,
  p_entity_type text default null,
  p_entity_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.user_activity_events (
    user_id, event_type, title, summary, entity_type, entity_id, metadata
  ) values (
    p_user_id, p_event_type, p_title, p_summary, p_entity_type, p_entity_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.record_user_activity(uuid, text, text, text, text, text, jsonb) from public;
grant execute on function public.record_user_activity(uuid, text, text, text, text, text, jsonb)
  to authenticated, service_role;

create or replace function public.list_user_activity(
  p_user_id uuid default null,
  p_limit int default 40
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_target uuid := coalesce(p_user_id, auth.uid());
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if v_target <> v_actor
     and not (
       public.user_has_founder_or_permission(v_actor, 'audit.read')
       or public.user_has_permission(v_actor, 'admin.panel')
     ) then
    raise exception 'not allowed';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.occurred_at desc)
    from (
      select id, user_id, event_type, title, summary, entity_type, entity_id, metadata, occurred_at
      from public.user_activity_events
      where user_id = v_target
      order by occurred_at desc
      limit greatest(1, least(coalesce(p_limit, 40), 100))
    ) t
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.list_user_activity(uuid, int) from public;
grant execute on function public.list_user_activity(uuid, int) to authenticated;

-- Hook publication submit/decide: append property timeline + partner activity
-- by replacing the two RPCs from 0036 with enriched versions.

create or replace function public.submit_property_for_review(p_property_id uuid)
returns public.property_publication_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_owner uuid;
  v_title text;
  v_kai jsonb;
  v_row public.property_publication_reviews;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select owner_id, title into v_owner, v_title
  from public.properties where id = p_property_id and deleted_at is null;
  if v_owner is null then
    raise exception 'property not found';
  end if;
  if v_owner <> v_actor
     and not public.user_has_founder_or_permission(v_actor, 'properties.review') then
    raise exception 'not allowed';
  end if;

  v_kai := public.kai_preliminary_property_check(p_property_id);

  update public.properties
  set
    status = 'draft',
    lifecycle_status = 'em_analise_documental',
    review_status = 'in_review',
    submitted_for_review_at = timezone('utc', now()),
    general_visible_at = null,
    premium_visible_at = null,
    updated_at = timezone('utc', now()),
    updated_by = v_actor
  where id = p_property_id;

  insert into public.property_publication_reviews (
    property_id, status, kai_preliminary, sla_deadline_at
  ) values (
    p_property_id,
    'in_review',
    v_kai,
    public.add_business_hours_wat(timezone('utc', now()), 12)
  )
  returning * into v_row;

  insert into public.property_timeline_events (
    property_id, event_type, title, summary, actor_id, metadata
  ) values (
    p_property_id,
    'publication_submitted',
    'Publicação submetida para análise',
    'A KAI fez análise preliminar. Aguarda decisão da Administração.',
    v_actor,
    jsonb_build_object('reviewId', v_row.id, 'kai', v_kai)
  );

  perform public.record_user_activity(
    v_owner,
    'publication_submitted',
    'Património submetido para análise',
    coalesce(v_title, 'Património'),
    'property',
    p_property_id::text,
    jsonb_build_object('reviewId', v_row.id)
  );

  perform public.notify_user(
    v_owner,
    'publication_submitted',
    'Património em análise',
    'A sua publicação entrou na fila de revisão da Administração. A KAI já fez uma análise preliminar.',
    '/app/patrimonios/detalhe?id=' || p_property_id::text,
    jsonb_build_object('propertyId', p_property_id, 'reviewId', v_row.id)
  );

  perform public.write_audit_event(
    'property_publication_submitted',
    'property',
    p_property_id::text,
    jsonb_build_object('reviewId', v_row.id),
    null, null, to_jsonb(v_row), null, null
  );

  return v_row;
end;
$$;

create or replace function public.admin_decide_property_publication(
  p_property_id uuid,
  p_decision text,
  p_pending_reason_codes text[] default '{}',
  p_admin_notes text default null
)
returns public.property_publication_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_owner uuid;
  v_title text;
  v_row public.property_publication_reviews;
  v_solutions text := '';
  v_label text;
  v_sol text;
  v_code text;
  v_notify_title text;
  v_notify_body text;
  v_lifecycle text;
  v_review_status text;
  v_now timestamptz := timezone('utc', now());
  v_timeline_title text;
begin
  if v_actor is null
     or not public.user_has_founder_or_permission(v_actor, 'properties.review') then
    raise exception 'properties.review required';
  end if;

  if p_decision not in (
    'approve', 'pending', 'reject', 'request_corrections',
    'request_technical_visit', 'request_documents'
  ) then
    raise exception 'invalid decision';
  end if;

  select owner_id, title into v_owner, v_title
  from public.properties where id = p_property_id and deleted_at is null;
  if v_owner is null then
    raise exception 'property not found';
  end if;

  if p_decision = 'pending'
     and coalesce(array_length(p_pending_reason_codes, 1), 0) = 0 then
    raise exception 'pending requires at least one reason code';
  end if;

  foreach v_code in array coalesce(p_pending_reason_codes, '{}') loop
    select label_pt, solution_pt into v_label, v_sol
    from public.publication_pending_reasons where code = v_code and active;
    if v_label is not null then
      v_solutions := v_solutions || E'\n• ' || v_label || ' — ' || v_sol;
    end if;
  end loop;

  case p_decision
    when 'approve' then
      v_review_status := 'approved';
      v_lifecycle := 'publicado';
      v_notify_title := 'Publicação aprovada';
      v_notify_body := 'O património «' || coalesce(v_title, '') ||
        '» foi aprovado. Durante ~6 horas estará em acesso prioritário a clientes premium; depois entra no feed geral.';
      v_timeline_title := 'Publicação aprovada';
    when 'pending' then
      v_review_status := 'pending';
      v_lifecycle := 'em_analise_documental';
      v_notify_title := 'Publicação em pendência';
      v_notify_body := 'A publicação foi colocada em pendência.' || coalesce(v_solutions, '');
      v_timeline_title := 'Publicação em pendência';
    when 'reject' then
      v_review_status := 'rejected';
      v_lifecycle := 'arquivado';
      v_notify_title := 'Publicação rejeitada';
      v_notify_body := 'A publicação foi rejeitada.' ||
        case when p_admin_notes is not null then E'\n' || p_admin_notes else '' end ||
        coalesce(v_solutions, '');
      v_timeline_title := 'Publicação rejeitada';
    when 'request_corrections' then
      v_review_status := 'corrections_requested';
      v_lifecycle := 'em_preparacao';
      v_notify_title := 'Correcções solicitadas';
      v_notify_body := 'Solicitamos correcções na ficha.' || coalesce(v_solutions, '');
      v_timeline_title := 'Correcções solicitadas';
    when 'request_technical_visit' then
      v_review_status := 'technical_visit_requested';
      v_lifecycle := 'em_inspecao_tecnica';
      v_notify_title := 'Visita técnica solicitada';
      v_notify_body := 'Será necessária uma visita técnica de um Agente Kuteka.' || coalesce(v_solutions, '');
      v_timeline_title := 'Visita técnica solicitada';
    when 'request_documents' then
      v_review_status := 'documents_requested';
      v_lifecycle := 'em_analise_documental';
      v_notify_title := 'Documentação adicional';
      v_notify_body := 'Envie a documentação adicional indicada.' || coalesce(v_solutions, '');
      v_timeline_title := 'Documentação adicional solicitada';
  end case;

  update public.properties
  set
    review_status = v_review_status,
    lifecycle_status = v_lifecycle,
    status = case when p_decision = 'approve' then 'active' else 'draft' end,
    premium_visible_at = case when p_decision = 'approve' then v_now else null end,
    general_visible_at = case when p_decision = 'approve' then v_now + interval '6 hours' else null end,
    updated_at = v_now,
    updated_by = v_actor
  where id = p_property_id;

  update public.property_publication_reviews
  set
    status = v_review_status,
    pending_reason_codes = coalesce(p_pending_reason_codes, '{}'),
    admin_notes = p_admin_notes,
    decided_by = v_actor,
    decided_at = v_now
  where id = (
    select id from public.property_publication_reviews
    where property_id = p_property_id
    order by created_at desc
    limit 1
  )
  returning * into v_row;

  if v_row.id is null then
    insert into public.property_publication_reviews (
      property_id, status, pending_reason_codes, admin_notes, decided_by, decided_at
    ) values (
      p_property_id, v_review_status, coalesce(p_pending_reason_codes, '{}'),
      p_admin_notes, v_actor, v_now
    )
    returning * into v_row;
  end if;

  insert into public.property_timeline_events (
    property_id, event_type, title, summary, actor_id, metadata
  ) values (
    p_property_id,
    'publication_' || p_decision,
    v_timeline_title,
    left(v_notify_body, 500),
    v_actor,
    jsonb_build_object(
      'decision', p_decision,
      'reasons', coalesce(p_pending_reason_codes, '{}'),
      'notes', p_admin_notes
    )
  );

  perform public.record_user_activity(
    v_owner,
    'publication_' || p_decision,
    v_timeline_title,
    coalesce(v_title, 'Património'),
    'property',
    p_property_id::text,
    jsonb_build_object('decision', p_decision)
  );

  perform public.notify_user(
    v_owner,
    'publication_' || p_decision,
    v_notify_title,
    v_notify_body,
    '/app/patrimonios/detalhe?id=' || p_property_id::text,
    jsonb_build_object(
      'propertyId', p_property_id,
      'decision', p_decision,
      'reasons', coalesce(p_pending_reason_codes, '{}')
    )
  );

  perform public.write_audit_event(
    'property_publication_' || p_decision,
    'property',
    p_property_id::text,
    jsonb_build_object('reviewId', v_row.id, 'reasons', coalesce(p_pending_reason_codes, '{}')),
    coalesce(nullif(trim(p_admin_notes), ''), v_timeline_title),
    null,
    to_jsonb(v_row),
    null,
    null
  );

  return v_row;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Reputação global — enrich trust summary (+ provider)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.get_user_trust_summary(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_trust_index numeric;
  v_ick_score numeric;
  v_kyc_level smallint;
  v_member_since timestamptz;
  v_last_activity_at timestamptz;
  v_rating_avg numeric;
  v_rating_count integer;
  v_rating_positive integer;
  v_rating_negative integer;
  v_contracts_completed integer;
  v_roles text[];
begin
  if p_user_id is null then
    return null;
  end if;

  select display_name, trust_index, ick_score, kyc_level, created_at, updated_at
  into v_display_name, v_trust_index, v_ick_score, v_kyc_level, v_member_since, v_last_activity_at
  from public.profiles
  where id = p_user_id and deleted_at is null;

  if not found then
    return null;
  end if;

  select avg(rating)::numeric, count(*)::int,
         count(*) filter (where rating >= 4)::int,
         count(*) filter (where rating <= 2)::int
  into v_rating_avg, v_rating_count, v_rating_positive, v_rating_negative
  from public.contract_reviews
  where subject_user_id = p_user_id;

  select count(*)::int into v_contracts_completed
  from public.property_contracts
  where status = 'completed'
    and deleted_at is null
    and (client_id = p_user_id or partner_id = p_user_id or agent_id = p_user_id);

  select coalesce(array_agg(r.code order by r.code), '{}')
  into v_roles
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = p_user_id;

  return jsonb_build_object(
    'userId', p_user_id,
    'displayName', v_display_name,
    'trustIndex', v_trust_index,
    'ickScore', v_ick_score,
    'kycLevel', v_kyc_level,
    'memberSince', v_member_since,
    'lastActivityAt', v_last_activity_at,
    'ratingAvg', v_rating_avg,
    'ratingCount', coalesce(v_rating_count, 0),
    'ratingPositive', coalesce(v_rating_positive, 0),
    'ratingNegative', coalesce(v_rating_negative, 0),
    'contractsCompleted', coalesce(v_contracts_completed, 0),
    'roles', to_jsonb(coalesce(v_roles, '{}'))
  );
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. KOS Analytics — operational indicators for Super/Admin
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.kos_ops_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_in_review int;
  v_overdue int;
  v_approved_7d int;
  v_rejected_7d int;
  v_avg_approve_hours numeric;
  v_interests int;
  v_contracts_started int;
  v_contracts_completed int;
  v_reports_open int;
begin
  if v_actor is null
     or not (
       public.user_has_founder_or_permission(v_actor, 'audit.read')
       or public.user_has_permission(v_actor, 'admin.panel')
       or public.user_has_permission(v_actor, 'finance.manage')
     ) then
    raise exception 'admin metrics required';
  end if;

  select count(*)::int into v_in_review
  from public.property_publication_reviews
  where status in (
    'in_review', 'pending', 'corrections_requested',
    'technical_visit_requested', 'documents_requested'
  );

  select count(*)::int into v_overdue
  from public.property_publication_reviews
  where status in (
    'in_review', 'pending', 'corrections_requested',
    'technical_visit_requested', 'documents_requested'
  )
    and sla_deadline_at is not null
    and sla_deadline_at < timezone('utc', now());

  select count(*)::int into v_approved_7d
  from public.property_publication_reviews
  where status = 'approved'
    and decided_at >= timezone('utc', now()) - interval '7 days';

  select count(*)::int into v_rejected_7d
  from public.property_publication_reviews
  where status = 'rejected'
    and decided_at >= timezone('utc', now()) - interval '7 days';

  select round(avg(extract(epoch from (decided_at - created_at)) / 3600.0)::numeric, 1)
  into v_avg_approve_hours
  from public.property_publication_reviews
  where status = 'approved'
    and decided_at is not null
    and decided_at >= timezone('utc', now()) - interval '30 days';

  select count(*)::int into v_interests from public.property_interests;
  select count(*)::int into v_contracts_started
  from public.property_contracts
  where status in ('draft', 'pending_acceptance', 'active')
    and coalesce(is_demo, false) = false;
  select count(*)::int into v_contracts_completed
  from public.property_contracts
  where status = 'completed' and coalesce(is_demo, false) = false;

  select count(*)::int into v_reports_open
  from public.content_reports where status in ('open', 'reviewing');

  return jsonb_build_object(
    'generatedAt', timezone('utc', now()),
    'publicationInReview', v_in_review,
    'publicationOverdueSla', v_overdue,
    'publicationApproved7d', v_approved_7d,
    'publicationRejected7d', v_rejected_7d,
    'avgApprovalHours30d', coalesce(v_avg_approve_hours, 0),
    'rejectionRate7d',
      case when (v_approved_7d + v_rejected_7d) > 0
        then round((v_rejected_7d::numeric / (v_approved_7d + v_rejected_7d)::numeric) * 100, 1)
        else 0
      end,
    'interestsTotal', v_interests,
    'contractsStarted', v_contracts_started,
    'contractsCompleted', v_contracts_completed,
    'interestToContractRate',
      case when v_interests > 0
        then round((v_contracts_started::numeric / v_interests::numeric) * 100, 1)
        else 0
      end,
    'contentReportsOpen', v_reports_open
  );
end;
$$;

revoke all on function public.kos_ops_metrics() from public;
grant execute on function public.kos_ops_metrics() to authenticated;

comment on function public.kos_ops_metrics() is
  'KOS Analytics — indicadores operacionais para decisão (Admin/Super/Founder).';
