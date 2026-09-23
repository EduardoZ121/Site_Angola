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
