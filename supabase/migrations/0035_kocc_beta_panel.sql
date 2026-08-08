-- 0035_kocc_beta_panel.sql
-- Sprint Beta 1.5 — Preparação para Utilizadores Reais
-- Painel Beta no KOCC: métricas agregadas + canal de feedback/bugs.
-- Aditivo (Core v1 freeze): novas tabelas/RPCs apenas.

-- ═══════════════════════════════════════════════════════════════════════════
-- 0. beta_feedback — feedback estruturado e bugs reportados pelos utilizadores
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('feedback', 'bug')),
  body text not null check (char_length(trim(body)) between 3 and 4000),
  page_path text,
  actor_id uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists beta_feedback_created_idx
  on public.beta_feedback (created_at desc);
create index if not exists beta_feedback_kind_idx
  on public.beta_feedback (kind, created_at desc);

alter table public.beta_feedback enable row level security;

drop policy if exists beta_feedback_insert_own on public.beta_feedback;
create policy beta_feedback_insert_own
  on public.beta_feedback for insert to authenticated
  with check (actor_id = auth.uid());

drop policy if exists beta_feedback_select_ops on public.beta_feedback;
create policy beta_feedback_select_ops
  on public.beta_feedback for select to authenticated
  using (
    public.user_has_permission(auth.uid(), 'finance.manage')
    or public.user_has_permission(auth.uid(), 'admin.panel')
  );

revoke update, delete on public.beta_feedback from anon, authenticated;
grant insert, select on public.beta_feedback to authenticated;
grant all on public.beta_feedback to service_role;

comment on table public.beta_feedback is
  'Sprint Beta — feedback e bugs reportados por utilizadores. Super Admin lê no Painel Beta (KOCC).';

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. beta_feature_events — contadores leves de utilização (mais/menos usados)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.beta_feature_events (
  feature_code text primary key,
  label text not null,
  event_count bigint not null default 0 check (event_count >= 0),
  last_seen_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.beta_feature_events enable row level security;

drop policy if exists beta_feature_events_select_ops on public.beta_feature_events;
create policy beta_feature_events_select_ops
  on public.beta_feature_events for select to authenticated
  using (
    public.user_has_permission(auth.uid(), 'finance.manage')
    or public.user_has_permission(auth.uid(), 'admin.panel')
  );

revoke insert, update, delete on public.beta_feature_events from anon, authenticated;
grant select on public.beta_feature_events to authenticated;
grant all on public.beta_feature_events to service_role;

-- Seed baseline feature codes (counts start at 0; proxies also fill the panel).
insert into public.beta_feature_events (feature_code, label, event_count) values
  ('housing.explore', 'Explorar habitação', 0),
  ('housing.interest', 'Demonstrar interesse', 0),
  ('patrimonios.activate', 'Activar património', 0),
  ('contratos.prepare', 'Preparar contrato', 0),
  ('kuteka_chat', 'Chat Kuteka', 0),
  ('kis.profile', 'Identidade KIS/KYC', 0),
  ('confianca.documents', 'Documentos de confiança', 0),
  ('marketplace', 'Marketplace / prestadores', 0),
  ('onboarding.roles', 'Onboarding de papéis', 0)
on conflict (feature_code) do nothing;

create or replace function public.kocc_track_feature(p_feature_code text, p_label text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  if p_feature_code is null or length(trim(p_feature_code)) = 0 then
    return;
  end if;

  insert into public.beta_feature_events (feature_code, label, event_count, last_seen_at, updated_at)
  values (
    trim(p_feature_code),
    coalesce(nullif(trim(p_label), ''), trim(p_feature_code)),
    1,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (feature_code) do update
  set
    event_count = public.beta_feature_events.event_count + 1,
    label = coalesce(nullif(trim(p_label), ''), public.beta_feature_events.label),
    last_seen_at = timezone('utc', now()),
    updated_at = timezone('utc', now());
end;
$$;

revoke all on function public.kocc_track_feature(text, text) from public;
grant execute on function public.kocc_track_feature(text, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. kocc_submit_beta_feedback
-- ═══════════════════════════════════════════════════════════════════════════

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

  insert into public.beta_feedback (kind, body, page_path, actor_id)
  values (p_kind, trim(p_body), nullif(trim(p_page_path), ''), v_actor)
  returning * into v_row;

  perform public.kocc_track_feature('beta.feedback', 'Feedback Beta');

  return v_row;
end;
$$;

revoke all on function public.kocc_submit_beta_feedback(text, text, text) from public;
grant execute on function public.kocc_submit_beta_feedback(text, text, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. kocc_beta_metrics — Painel Beta (Super Admin / finance.manage)
-- ═══════════════════════════════════════════════════════════════════════════

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
  if v_actor is null or not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'finance.manage required';
  end if;

  select count(*)::int into v_profiles
  from public.profiles where deleted_at is null;

  -- Utilizadores Beta: contas reais (exclui seeds *@kuteka.local em auth.users).
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

  -- Proxy de visitas agendadas: interesses em acompanhamento activo.
  select count(*)::int into v_visits
  from public.property_interests
  where status in ('submitted', 'reviewing', 'assigned');

  select count(*)::int into v_contracts_started
  from public.property_contracts
  where coalesce(is_demo, false) = false
    and status in ('draft', 'pending_acceptance', 'active');

  select count(*)::int into v_feedback
  from public.beta_feedback where kind = 'feedback';

  select count(*)::int into v_bugs
  from public.beta_feedback where kind = 'bug';

  -- Proxy usage from live tables (merged with tracked events in UI layer).
  v_proxy := jsonb_build_array(
    jsonb_build_object('code', 'housing.interest', 'label', 'Demonstrar interesse',
      'count', (select count(*)::int from public.property_interests)),
    jsonb_build_object('code', 'contratos.prepare', 'label', 'Contratos',
      'count', (select count(*)::int from public.property_contracts)),
    jsonb_build_object('code', 'kuteka_chat', 'label', 'Chat Kuteka',
      'count', (select count(*)::int from public.kuteka_messages)),
    jsonb_build_object('code', 'confianca.documents', 'label', 'Documentos de confiança',
      'count', (select count(*)::int from public.trust_documents where deleted_at is null)),
    jsonb_build_object('code', 'kis.profile', 'label', 'Identidade KIS/KYC',
      'count', (select count(*)::int from public.profiles where coalesce(kyc_level, 0) >= 1 and deleted_at is null)),
    jsonb_build_object('code', 'patrimonios.activate', 'label', 'Patrimónios activos',
      'count', (select count(*)::int from public.properties where deleted_at is null and status = 'active')),
    jsonb_build_object('code', 'marketplace', 'label', 'Prestadores',
      'count', (select count(*)::int from public.service_providers where coalesce(active, true)))
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
  'KOCC Painel Beta — métricas agregadas para decisão de saída da fase Beta.';
