-- Kuteka ecosystem migrations 0043-0048 (apply once on vhqwitbrpqaiutjbundo)
-- Generated from main after PR #75

-- >>> supabase/migrations/0043_beta_feedback_founder_read_access.sql
-- 0043_beta_feedback_founder_read_access.sql
-- Applied from docs/engineering/proposals/0043 (Founder authorization granted).
-- Align beta_feedback SELECT + kocc_beta_metrics with user_has_founder_or_permission.

drop policy if exists beta_feedback_select_ops on public.beta_feedback;
create policy beta_feedback_select_ops
  on public.beta_feedback for select to authenticated
  using (
    public.user_has_founder_or_permission(auth.uid(), 'finance.manage')
    or public.user_has_permission(auth.uid(), 'admin.panel')
  );

drop policy if exists beta_feature_events_select_ops on public.beta_feature_events;
create policy beta_feature_events_select_ops
  on public.beta_feature_events for select to authenticated
  using (
    public.user_has_founder_or_permission(auth.uid(), 'finance.manage')
    or public.user_has_permission(auth.uid(), 'admin.panel')
  );

create or replace function public.kocc_beta_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_profiles int;
  v_beta_users int;
  v_with_roles int;
  v_kis_ok int;
  v_props_real int;
  v_props_beta int;
  v_visits int;
  v_contracts_started int;
  v_feedback int;
  v_bugs int;
  v_features_most jsonb;
  v_features_least jsonb;
  v_proxy jsonb;
begin
  if v_actor is null
     or not public.user_has_founder_or_permission(v_actor, 'finance.manage') then
    raise exception 'finance.manage required';
  end if;

  select count(*)::int into v_profiles
  from public.profiles where deleted_at is null;

  select count(*)::int into v_beta_users
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.deleted_at is null
    and (u.email is null or u.email not ilike '%@kuteka.local');

  select count(distinct ur.user_id)::int into v_with_roles
  from public.user_roles ur
  join public.profiles p on p.id = ur.user_id and p.deleted_at is null
  join auth.users u on u.id = p.id
  where u.email is null or u.email not ilike '%@kuteka.local';

  select count(*)::int into v_kis_ok
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.deleted_at is null
    and coalesce(p.kyc_level, 0) >= 2
    and (u.email is null or u.email not ilike '%@kuteka.local');

  select count(*)::int into v_props_real
  from public.properties
  where deleted_at is null
    and coalesce(is_demo, false) = false
    and status = 'active';

  select count(*)::int into v_props_beta
  from public.properties
  where deleted_at is null
    and coalesce(is_demo, false) = true;

  select count(*)::int into v_visits
  from public.property_interests i
  join public.properties p on p.id = i.property_id
  where i.status in ('submitted', 'reviewing', 'assigned')
    and coalesce(p.is_demo, false) = false;

  select count(*)::int into v_contracts_started
  from public.property_contracts
  where coalesce(is_demo, false) = false
    and status in ('draft', 'pending_acceptance', 'active');

  select count(*)::int into v_feedback
  from public.beta_feedback where kind = 'feedback';

  select count(*)::int into v_bugs
  from public.beta_feedback where kind = 'bug';

  v_proxy := jsonb_build_array(
    jsonb_build_object('code', 'housing.interest', 'label', 'Demonstrar interesse',
      'count', (
        select count(*)::int
        from public.property_interests i
        join public.properties p on p.id = i.property_id
        where coalesce(p.is_demo, false) = false
      )),
    jsonb_build_object('code', 'contratos.prepare', 'label', 'Contratos',
      'count', (
        select count(*)::int from public.property_contracts
        where coalesce(is_demo, false) = false
      )),
    jsonb_build_object('code', 'kuteka_chat', 'label', 'Chat Kuteka',
      'count', (select count(*)::int from public.kuteka_messages)),
    jsonb_build_object('code', 'confianca.documents', 'label', 'Documentos de confiança',
      'count', (select count(*)::int from public.trust_documents where deleted_at is null)),
    jsonb_build_object('code', 'kis.profile', 'label', 'Identidade KIS/KYC',
      'count', (select count(*)::int from public.profiles where coalesce(kyc_level, 0) >= 1 and deleted_at is null)),
    jsonb_build_object('code', 'patrimonios.activate', 'label', 'Patrimónios activos',
      'count', (
        select count(*)::int from public.properties
        where deleted_at is null and status = 'active' and coalesce(is_demo, false) = false
      )),
    jsonb_build_object('code', 'marketplace', 'label', 'Prestadores',
      'count', (
        select count(*)::int from public.service_providers
        where coalesce(active, true) and coalesce(is_demo, false) = false
      ))
  );

  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_features_most
  from (
    select feature_code as code, label, event_count as count
    from public.beta_feature_events
    order by event_count desc, feature_code
    limit 8
  ) t;

  select coalesce(jsonb_agg(row_to_json(t)::jsonb), '[]'::jsonb)
  into v_features_least
  from (
    select feature_code as code, label, event_count as count
    from public.beta_feature_events
    order by event_count asc, feature_code
    limit 8
  ) t;

  return jsonb_build_object(
    'generatedAt', timezone('utc', now()),
    'betaUsers', v_beta_users,
    'profilesTotal', v_profiles,
    'propertiesReal', v_props_real,
    'propertiesBetaInventory', v_props_beta,
    'visitsScheduled', v_visits,
    'contractsStarted', v_contracts_started,
    'feedbackReceived', v_feedback,
    'bugsReported', v_bugs,
    'onboardingCompletionRate',
      case when v_beta_users > 0
        then round((v_with_roles::numeric / v_beta_users::numeric) * 100, 1)
        else 0
      end,
    'kisCompletionRate',
      case when v_beta_users > 0
        then round((v_kis_ok::numeric / v_beta_users::numeric) * 100, 1)
        else 0
      end,
    'featuresMostUsed', v_features_most,
    'featuresLeastUsed', v_features_least,
    'featureUsageProxy', v_proxy,
    'modulesOperational', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'code', code,
        'label', label,
        'status', operational_status,
        'enabled', enabled
      ) order by label), '[]'::jsonb)
      from public.platform_feature_flags
    )
  );
end;
$$;

revoke all on function public.kocc_beta_metrics() from public;
grant execute on function public.kocc_beta_metrics() to authenticated;

comment on function public.kocc_beta_metrics() is
  'KOCC Painel Beta — métricas agregadas; finance.manage ou Founder.';


-- >>> supabase/migrations/0044_beta_feedback_submit_path_guard.sql
-- 0044_beta_feedback_submit_path_guard.sql
-- Applied from docs/engineering/proposals/0044 (Founder authorization granted).
-- Truncate page_path server-side; keep kind set as feedback|bug (expanded in 0046).

create or replace function public.kocc_submit_beta_feedback(
  p_kind text,
  p_body text,
  p_page_path text default null
)
returns public.beta_feedback
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_row public.beta_feedback;
  v_path text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if p_kind is null or p_kind not in ('feedback', 'bug') then
    raise exception 'kind must be feedback or bug';
  end if;
  if p_body is null or char_length(trim(p_body)) < 3 then
    raise exception 'body too short';
  end if;
  if char_length(trim(p_body)) > 4000 then
    raise exception 'body too long';
  end if;

  v_path := nullif(trim(p_page_path), '');
  if v_path is not null and char_length(v_path) > 500 then
    v_path := left(v_path, 500);
  end if;

  insert into public.beta_feedback (kind, body, page_path, actor_id)
  values (p_kind, trim(p_body), v_path, v_actor)
  returning * into v_row;

  perform public.kocc_track_feature('beta.feedback', 'Feedback Beta');

  return v_row;
end;
$$;

revoke all on function public.kocc_submit_beta_feedback(text, text, text) from public;
grant execute on function public.kocc_submit_beta_feedback(text, text, text) to authenticated;


-- >>> supabase/migrations/0045_beta_feedback_rpc_only_insert.sql
-- 0045_beta_feedback_rpc_only_insert.sql
-- Applied from docs/engineering/proposals/0045 (Founder authorization granted).
-- Force beta_feedback writes through kocc_submit_beta_feedback (security definer).

revoke insert on public.beta_feedback from authenticated;

-- Keep SELECT for ops/Founder via RLS; RPC remains the write path.
grant select on public.beta_feedback to authenticated;
grant execute on function public.kocc_submit_beta_feedback(text, text, text) to authenticated;

comment on table public.beta_feedback is
  'Sprint Beta — feedback/bugs. INSERT only via kocc_submit_beta_feedback; SELECT ops/Founder.';


-- >>> supabase/migrations/0046_beta_feedback_status_workflow.sql
-- 0046_beta_feedback_status_workflow.sql
-- Doc3 feedback cycle: status machine + kind expansion + page_context (no screenshot storage).
-- Mutations via security definer RPC + audit_logs (UPDATE stays revoked on authenticated).

-- ─── Columns ────────────────────────────────────────────────────────────────
alter table public.beta_feedback
  add column if not exists status text not null default 'received',
  add column if not exists page_context jsonb not null default '{}'::jsonb,
  add column if not exists status_updated_at timestamptz,
  add column if not exists status_updated_by uuid references auth.users (id),
  add column if not exists resolution_notes text;

-- Expand kind check: keep feedback|bug; add avaliacao|reclamacao (product channel only).
alter table public.beta_feedback drop constraint if exists beta_feedback_kind_check;
alter table public.beta_feedback
  add constraint beta_feedback_kind_check
  check (kind in ('feedback', 'bug', 'avaliacao', 'reclamacao'));

alter table public.beta_feedback drop constraint if exists beta_feedback_status_check;
alter table public.beta_feedback
  add constraint beta_feedback_status_check
  check (status in (
    'received',
    'em_analise',
    'classificado',
    'em_desenvolvimento',
    'resolvido',
    'duplicado',
    'nao_reproduzivel'
  ));

create index if not exists beta_feedback_status_idx
  on public.beta_feedback (status, created_at desc);

comment on column public.beta_feedback.status is
  'Doc3 triage: received→em_analise→classificado→em_desenvolvimento→resolvido|duplicado|nao_reproduzivel';
comment on column public.beta_feedback.page_context is
  'Optional lightweight context (route, locale, viewport). No screenshot blobs — storage not ready.';

-- ─── Submit: kinds + optional page_context; default status=received ─────────
create or replace function public.kocc_submit_beta_feedback(
  p_kind text,
  p_body text,
  p_page_path text default null,
  p_page_context jsonb default null
)
returns public.beta_feedback
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_row public.beta_feedback;
  v_path text;
  v_ctx jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if p_kind is null
     or p_kind not in ('feedback', 'bug', 'avaliacao', 'reclamacao') then
    raise exception 'kind must be feedback, bug, avaliacao or reclamacao';
  end if;
  if p_body is null or char_length(trim(p_body)) < 3 then
    raise exception 'body too short';
  end if;
  if char_length(trim(p_body)) > 4000 then
    raise exception 'body too long';
  end if;

  v_path := nullif(trim(p_page_path), '');
  if v_path is not null and char_length(v_path) > 500 then
    v_path := left(v_path, 500);
  end if;

  v_ctx := coalesce(p_page_context, '{}'::jsonb);
  if jsonb_typeof(v_ctx) <> 'object' then
    v_ctx := '{}'::jsonb;
  end if;
  -- Cap payload size (no media / base64 screenshots).
  if octet_length(v_ctx::text) > 4000 then
    raise exception 'page_context too large';
  end if;
  if v_ctx ? 'screenshot' or v_ctx ? 'screenshot_url' or v_ctx ? 'image' then
    raise exception 'screenshot upload not supported';
  end if;

  insert into public.beta_feedback (
    kind, body, page_path, actor_id, status, page_context
  )
  values (
    p_kind, trim(p_body), v_path, v_actor, 'received', v_ctx
  )
  returning * into v_row;

  perform public.kocc_track_feature('beta.feedback', 'Feedback Beta');

  return v_row;
end;
$$;

-- Drop 3-arg overload so clients use the 4-arg form (defaults keep 3-arg call sites working
-- only if Postgres keeps a single function with defaults — recreate grants on 4-arg).
drop function if exists public.kocc_submit_beta_feedback(text, text, text);

revoke all on function public.kocc_submit_beta_feedback(text, text, text, jsonb) from public;
grant execute on function public.kocc_submit_beta_feedback(text, text, text, jsonb) to authenticated;

-- ─── Status update RPC (ops / Founder) + audit ──────────────────────────────
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

  return v_row;
end;
$$;

revoke all on function public.kocc_update_beta_feedback_status(uuid, text, text) from public;
grant execute on function public.kocc_update_beta_feedback_status(uuid, text, text) to authenticated;

comment on function public.kocc_update_beta_feedback_status(uuid, text, text) is
  'Ops/Founder triage: update beta_feedback.status with audit_logs trail.';


-- >>> supabase/migrations/0047_availability_notify_on_publish.sql
-- 0047_availability_notify_on_publish.sql
-- Doc3 matching notify: when a property becomes publicado/active, notify users with
-- open availability_notify_requests (reuses notify_user).
--
-- Trigger path (security definer) — no client-facing RPC required.
-- Expected behaviour (SQL-doc test contract):
--   1. UPDATE properties SET status='active' OR lifecycle_status='publicado'
--      from a non-matching prior state → notify each open request once.
--   2. Mark matching requests status='notified'.
--   3. Idempotent: second update while already active/publicado does not re-notify.
--   4. Does not fire Pay/custody, Growth Engine, or AGT scraping.

create or replace function public.notify_availability_request_clients(
  p_property_id uuid,
  p_property_title text default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req record;
  v_count int := 0;
  v_title text := coalesce(nullif(trim(p_property_title), ''), 'Património');
  v_href text;
begin
  v_href := '/app/habitacao/detalhe?id=' || p_property_id::text;

  for v_req in
    select id, client_id
    from public.availability_notify_requests
    where property_id = p_property_id
      and status = 'open'
  loop
    perform public.notify_user(
      v_req.client_id,
      'availability.available',
      'Imóvel disponível',
      v_title || ' está agora disponível na Kuteka.',
      v_href,
      jsonb_build_object(
        'property_id', p_property_id,
        'request_id', v_req.id
      )
    );

    update public.availability_notify_requests
    set status = 'notified',
        updated_at = timezone('utc', now())
    where id = v_req.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.notify_availability_request_clients(uuid, text) from public;
grant execute on function public.notify_availability_request_clients(uuid, text) to service_role;

create or replace function public.trg_properties_notify_availability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_became_active boolean;
  v_became_publicado boolean;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if new.deleted_at is not null then
    return new;
  end if;

  v_became_active :=
    new.status = 'active'
    and coalesce(old.status, '') is distinct from 'active';

  v_became_publicado :=
    coalesce(new.lifecycle_status, '') = 'publicado'
    and coalesce(old.lifecycle_status, '') is distinct from 'publicado';

  if v_became_active or v_became_publicado then
    perform public.notify_availability_request_clients(new.id, new.title);
  end if;

  return new;
end;
$$;

drop trigger if exists properties_notify_availability on public.properties;
create trigger properties_notify_availability
after update of status, lifecycle_status, deleted_at on public.properties
for each row
execute function public.trg_properties_notify_availability();

comment on function public.notify_availability_request_clients(uuid, text) is
  'Notify clients with open availability_notify_requests when property becomes available.';
comment on function public.trg_properties_notify_availability() is
  'AFTER UPDATE on properties: publish/active → notify_availability_request_clients.';


-- >>> supabase/migrations/0048_assign_property_interest.sql
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

