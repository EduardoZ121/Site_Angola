-- 0036_trust_governance_gate.sql
-- Sprint Beta 1.6 — Trust Governance Gate (Fase A)
-- Founders, aprovação de publicações, pendências, notificações, comissão configurável,
-- campos ricos no património. Aditivo (Core v1 freeze respeitado).

-- ═══════════════════════════════════════════════════════════════════════════
-- 0. Permissions for publication review + founder ops
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.permissions (code, description)
values
  ('properties.review', 'Rever e decidir publicações de património'),
  ('founder.manage', 'Operações exclusivas de Founder/Owner (comissões, governação)')
on conflict (code) do update
set description = excluded.description,
    updated_at = timezone('utc', now());

-- Administrators + super_administrator get properties.review
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'properties.review'
where r.code in ('administrator', 'super_administrator')
on conflict do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. founders — privilégios acima aos Super Administradores
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.founders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  is_founder boolean not null default true,
  is_owner boolean not null default false,
  display_label text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  check (is_founder = true or is_owner = true)
);

create index if not exists founders_user_id_idx on public.founders (user_id);

alter table public.founders enable row level security;

drop policy if exists founders_select_authenticated on public.founders;
create policy founders_select_authenticated
  on public.founders for select to authenticated
  using (
    user_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'finance.manage')
    or exists (
      select 1 from public.founders f where f.user_id = auth.uid()
    )
  );

-- Writes only via security definer RPCs
revoke insert, update, delete on public.founders from anon, authenticated;
grant select on public.founders to authenticated;
grant all on public.founders to service_role;

comment on table public.founders is
  'Founders/Owners — privilégios acima de Super Admin. Trocar email = trocar user_id; permissões permanecem.';

create or replace function public.is_founder(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.founders f
    where f.user_id = p_user_id and f.is_founder = true
  );
$$;

create or replace function public.is_platform_owner(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.founders f
    where f.user_id = p_user_id and f.is_owner = true
  );
$$;

revoke all on function public.is_founder(uuid) from public;
revoke all on function public.is_platform_owner(uuid) from public;
grant execute on function public.is_founder(uuid) to authenticated;
grant execute on function public.is_platform_owner(uuid) to authenticated;

-- Founders inherit Super-level permissions in practice via this helper.
create or replace function public.user_has_founder_or_permission(
  p_user_id uuid,
  p_permission text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_founder(p_user_id)
      or public.is_platform_owner(p_user_id)
      or public.user_has_permission(p_user_id, p_permission);
$$;

revoke all on function public.user_has_founder_or_permission(uuid, text) from public;
grant execute on function public.user_has_founder_or_permission(uuid, text) to authenticated;

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
  v_row public.founders;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  -- Bootstrap: any existing owner may link; or first founder when table empty + finance.manage
  if not public.is_platform_owner(v_actor) then
    if exists (select 1 from public.founders where is_owner = true) then
      raise exception 'only platform owner can link founders';
    end if;
    if not public.user_has_permission(v_actor, 'finance.manage')
       and not public.is_founder(v_actor) then
      raise exception 'founder.manage bootstrap requires finance.manage or empty owners';
    end if;
  end if;

  insert into public.founders (user_id, is_founder, is_owner, display_label, created_by)
  values (p_user_id, true, coalesce(p_is_owner, false), p_display_label, v_actor)
  on conflict (user_id) do update
  set
    is_founder = true,
    is_owner = excluded.is_owner or public.founders.is_owner,
    display_label = coalesce(excluded.display_label, public.founders.display_label)
  returning * into v_row;

  -- Ensure founder has super_administrator role for UI surfaces
  insert into public.user_roles (user_id, role_id)
  select p_user_id, r.id
  from public.roles r
  where r.code = 'super_administrator'
  on conflict do nothing;

  return v_row;
end;
$$;

revoke all on function public.founder_link_user(uuid, boolean, text) from public;
grant execute on function public.founder_link_user(uuid, boolean, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Rich property fields (activação)
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.properties
  add column if not exists suites integer check (suites is null or suites >= 0),
  add column if not exists furnished boolean,
  add column if not exists has_garage boolean,
  add column if not exists has_yard boolean,
  add column if not exists has_pool boolean,
  add column if not exists has_garden boolean,
  add column if not exists has_annex boolean,
  add column if not exists has_equipped_kitchen boolean,
  add column if not exists has_balcony boolean,
  add column if not exists has_terrace boolean,
  add column if not exists land_area_m2 numeric(12,2),
  add column if not exists built_area_m2 numeric(12,2),
  add column if not exists review_status text,
  add column if not exists general_visible_at timestamptz,
  add column if not exists premium_visible_at timestamptz,
  add column if not exists commission_settlement text,
  add column if not exists submitted_for_review_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'properties_review_status_check'
  ) then
    alter table public.properties
      add constraint properties_review_status_check
      check (
        review_status is null
        or review_status in (
          'in_review',
          'pending',
          'approved',
          'rejected',
          'corrections_requested',
          'technical_visit_requested',
          'documents_requested'
        )
      );
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'properties_commission_settlement_check'
  ) then
    alter table public.properties
      add constraint properties_commission_settlement_check
      check (
        commission_settlement is null
        or commission_settlement in (
          'immediate',
          'after_first_rent',
          'automatic_retention'
        )
      );
  end if;
end $$;

comment on column public.properties.review_status is
  'Publication approval workflow (Beta 1.6). Independent of marketplace status.';
comment on column public.properties.general_visible_at is
  'When listing enters general feed (after premium window).';
comment on column public.properties.premium_visible_at is
  'When listing becomes visible to premium clients (~6h before general).';

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Pending reason catalog + publication reviews
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.publication_pending_reasons (
  code text primary key,
  label_pt text not null,
  solution_pt text not null,
  sort_order int not null default 100,
  active boolean not null default true
);

insert into public.publication_pending_reasons (code, label_pt, solution_pt, sort_order) values
  ('partner_identity_unconfirmed', 'Identidade do Parceiro Patrimonial não confirmada',
   'Complete a verificação KIS/KYC no Centro de Confiança antes de republicar.', 10),
  ('property_document_insufficient', 'Documento do imóvel insuficiente',
   'Carregue o título de propriedade ou documento equivalente validado.', 20),
  ('not_in_advertiser_name', 'Imóvel não está em nome do anunciante',
   'Envie prova de legitimidade (procuração, contrato social ou autorização).', 30),
  ('photos_insufficient', 'Fotografias insuficientes',
   'Adicione pelo menos 5 fotografias nítidas dos espaços principais.', 40),
  ('no_facade_photos', 'Não existem fotografias da fachada',
   'Solicitamos fotografias da fachada do imóvel.', 50),
  ('no_street_photos', 'Não existem fotografias da rua',
   'Adicione fotografias da rua / envolvente imediata.', 60),
  ('address_inconsistent', 'Endereço inconsistente',
   'Corrija morada, bairro e município para coincidirem com o documento.', 70),
  ('gps_invalid', 'GPS inválido',
   'Actualize as coordenadas GPS no mapa da ficha de activação.', 80),
  ('contradictory_info', 'Informação contraditória',
   'Revise tipologia, áreas e descrição — há dados em conflito.', 90),
  ('fraud_suspicion', 'Suspeita de fraude',
   'Será necessária uma visita técnica de um Agente Kuteka e validação documental reforçada.', 100),
  ('technical_visit_needed', 'Visita técnica necessária',
   'Será necessária uma visita técnica de um Agente Kuteka.', 110),
  ('additional_docs', 'Documentação adicional necessária',
   'Envie a documentação adicional indicada na notificação.', 120)
on conflict (code) do update
set label_pt = excluded.label_pt,
    solution_pt = excluded.solution_pt,
    sort_order = excluded.sort_order,
    active = true;

alter table public.publication_pending_reasons enable row level security;
drop policy if exists publication_pending_reasons_select on public.publication_pending_reasons;
create policy publication_pending_reasons_select
  on public.publication_pending_reasons for select to authenticated
  using (active = true);
grant select on public.publication_pending_reasons to authenticated;

create table if not exists public.property_publication_reviews (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  status text not null default 'in_review'
    check (status in (
      'in_review',
      'pending',
      'approved',
      'rejected',
      'corrections_requested',
      'technical_visit_requested',
      'documents_requested'
    )),
  kai_preliminary jsonb not null default '{}'::jsonb,
  pending_reason_codes text[] not null default '{}',
  admin_notes text,
  decided_by uuid references auth.users (id),
  decided_at timestamptz,
  sla_deadline_at timestamptz,
  escalated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists property_publication_reviews_status_idx
  on public.property_publication_reviews (status, created_at desc);
create index if not exists property_publication_reviews_property_idx
  on public.property_publication_reviews (property_id, created_at desc);

drop trigger if exists property_publication_reviews_set_updated_at on public.property_publication_reviews;
create trigger property_publication_reviews_set_updated_at
before update on public.property_publication_reviews
for each row execute function public.set_updated_at();

alter table public.property_publication_reviews enable row level security;

drop policy if exists property_publication_reviews_select on public.property_publication_reviews;
create policy property_publication_reviews_select
  on public.property_publication_reviews for select to authenticated
  using (
    public.user_has_founder_or_permission(auth.uid(), 'properties.review')
    or public.user_has_permission(auth.uid(), 'admin.panel')
    or exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  );

revoke insert, update, delete on public.property_publication_reviews from anon, authenticated;
grant select on public.property_publication_reviews to authenticated;
grant all on public.property_publication_reviews to service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. user_notifications — canal in-app (Parceiro recebe decisões)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  href text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_notifications_user_created_idx
  on public.user_notifications (user_id, created_at desc);

alter table public.user_notifications enable row level security;

drop policy if exists user_notifications_select_own on public.user_notifications;
create policy user_notifications_select_own
  on public.user_notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists user_notifications_update_own on public.user_notifications;
create policy user_notifications_update_own
  on public.user_notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke insert, delete on public.user_notifications from anon, authenticated;
grant select, update on public.user_notifications to authenticated;
grant all on public.user_notifications to service_role;

create or replace function public.notify_user(
  p_user_id uuid,
  p_kind text,
  p_title text,
  p_body text,
  p_href text default null,
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
  insert into public.user_notifications (user_id, kind, title, body, href, metadata)
  values (p_user_id, p_kind, p_title, p_body, p_href, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.notify_user(uuid, text, text, text, text, jsonb) from public;
grant execute on function public.notify_user(uuid, text, text, text, text, jsonb) to service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. Commission params (Founder/Owner only)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.platform_commission_params (
  code text primary key,
  label text not null,
  value_numeric numeric(8,4) not null,
  unit text not null default 'percent',
  notes text,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users (id)
);

insert into public.platform_commission_params (code, label, value_numeric, unit, notes)
values (
  'activation_intermediation_first_month_pct',
  'Comissão de activação — intermediação (1.º mês de arrendamento)',
  35.0000,
  'percent',
  'Aplicável quando a Kuteka apenas intermedia (sem obras). Configurável só por Founder/Owner.'
)
on conflict (code) do nothing;

alter table public.platform_commission_params enable row level security;
drop policy if exists platform_commission_params_select on public.platform_commission_params;
create policy platform_commission_params_select
  on public.platform_commission_params for select to authenticated
  using (true);
grant select on public.platform_commission_params to authenticated;
revoke insert, update, delete on public.platform_commission_params from anon, authenticated;
grant all on public.platform_commission_params to service_role;

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
  return v_row;
end;
$$;

revoke all on function public.founder_set_commission_param(text, numeric, text) from public;
grant execute on function public.founder_set_commission_param(text, numeric, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. KAI preliminary + submit / decide RPCs
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.kai_preliminary_property_check(p_property_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  p public.properties%rowtype;
  v_media_count int;
  v_issues text[] := '{}';
  v_suggestions text[] := '{}';
  v_score int := 100;
begin
  select * into p from public.properties where id = p_property_id;
  if p.id is null then
    return jsonb_build_object('ok', false, 'issues', jsonb_build_array('property_not_found'));
  end if;

  select count(*)::int into v_media_count
  from public.property_media where property_id = p_property_id;

  if coalesce(p.title, '') = '' or char_length(trim(p.title)) < 3 then
    v_issues := array_append(v_issues, 'title_missing');
    v_score := v_score - 15;
  end if;
  if p.price_aoa is null then
    v_issues := array_append(v_issues, 'price_missing');
    v_score := v_score - 10;
  end if;
  if p.province is null or p.city is null then
    v_issues := array_append(v_issues, 'location_incomplete');
    v_score := v_score - 10;
  end if;
  if p.latitude is null or p.longitude is null then
    v_issues := array_append(v_issues, 'gps_missing');
    v_score := v_score - 10;
    v_suggestions := array_append(v_suggestions, 'Indique GPS válido na ficha.');
  end if;
  if v_media_count < 5 then
    v_issues := array_append(v_issues, 'photos_insufficient');
    v_score := v_score - 15;
    v_suggestions := array_append(v_suggestions, 'Adicione pelo menos 5 fotografias nítidas.');
  end if;
  if p.conservation_state is null then
    v_issues := array_append(v_issues, 'conservation_missing');
    v_score := v_score - 5;
    v_suggestions := array_append(v_suggestions, 'Indique o estado de conservação.');
  end if;

  return jsonb_build_object(
    'ok', coalesce(array_length(v_issues, 1), 0) = 0,
    'score', greatest(v_score, 0),
    'mediaCount', v_media_count,
    'issues', to_jsonb(v_issues),
    'suggestions', to_jsonb(v_suggestions)
  );
end;
$$;

revoke all on function public.kai_preliminary_property_check(uuid) from public;
grant execute on function public.kai_preliminary_property_check(uuid) to authenticated;

-- Business hours SLA helper: +12 hours within 08:00–17:00 WAT (UTC+1 approx via Africa/Luanda).
create or replace function public.add_business_hours_wat(
  p_from timestamptz,
  p_hours int default 12
)
returns timestamptz
language plpgsql
immutable
as $$
declare
  v_local timestamp;
  v_hour int;
  v_remaining int := p_hours;
  v_tz text := 'Africa/Luanda';
begin
  v_local := (p_from at time zone v_tz);
  while v_remaining > 0 loop
    v_local := v_local + interval '1 hour';
    -- Skip nights 17:00–08:00 and weekends
    if extract(dow from v_local) in (0, 6) then
      continue;
    end if;
    v_hour := extract(hour from v_local)::int;
    if v_hour >= 8 and v_hour < 17 then
      v_remaining := v_remaining - 1;
    end if;
  end loop;
  return v_local at time zone v_tz;
end;
$$;

create or replace function public.submit_property_for_review(p_property_id uuid)
returns public.property_publication_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_owner uuid;
  v_kai jsonb;
  v_row public.property_publication_reviews;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  select owner_id into v_owner from public.properties where id = p_property_id and deleted_at is null;
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

  perform public.notify_user(
    v_owner,
    'publication_submitted',
    'Património em análise',
    'A sua publicação entrou na fila de revisão da Administração. A KAI já fez uma análise preliminar.',
    '/app/patrimonios/detalhe?id=' || p_property_id::text,
    jsonb_build_object('propertyId', p_property_id, 'reviewId', v_row.id)
  );

  return v_row;
end;
$$;

revoke all on function public.submit_property_for_review(uuid) from public;
grant execute on function public.submit_property_for_review(uuid) to authenticated;

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

  if p_decision in ('pending', 'request_corrections', 'request_documents', 'request_technical_visit')
     and coalesce(array_length(p_pending_reason_codes, 1), 0) = 0
     and p_decision = 'pending' then
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
    when 'pending' then
      v_review_status := 'pending';
      v_lifecycle := 'em_analise_documental';
      v_notify_title := 'Publicação em pendência';
      v_notify_body := 'A publicação foi colocada em pendência.' || coalesce(v_solutions, '');
    when 'reject' then
      v_review_status := 'rejected';
      v_lifecycle := 'arquivado';
      v_notify_title := 'Publicação rejeitada';
      v_notify_body := 'A publicação foi rejeitada.' ||
        case when p_admin_notes is not null then E'\n' || p_admin_notes else '' end ||
        coalesce(v_solutions, '');
    when 'request_corrections' then
      v_review_status := 'corrections_requested';
      v_lifecycle := 'em_preparacao';
      v_notify_title := 'Correcções solicitadas';
      v_notify_body := 'Solicitamos correcções na ficha.' || coalesce(v_solutions, '');
    when 'request_technical_visit' then
      v_review_status := 'technical_visit_requested';
      v_lifecycle := 'em_inspecao_tecnica';
      v_notify_title := 'Visita técnica solicitada';
      v_notify_body := 'Será necessária uma visita técnica de um Agente Kuteka.' || coalesce(v_solutions, '');
    when 'request_documents' then
      v_review_status := 'documents_requested';
      v_lifecycle := 'em_analise_documental';
      v_notify_title := 'Documentação adicional';
      v_notify_body := 'Envie a documentação adicional indicada.' || coalesce(v_solutions, '');
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

  perform public.write_audit_log(
    'property_publication_' || p_decision,
    'property',
    p_property_id::text,
    jsonb_build_object(
      'reviewId', v_row.id,
      'reasons', coalesce(p_pending_reason_codes, '{}'),
      'notes', p_admin_notes
    )
  );

  return v_row;
end;
$$;

revoke all on function public.admin_decide_property_publication(uuid, text, text[], text) from public;
grant execute on function public.admin_decide_property_publication(uuid, text, text[], text) to authenticated;

create or replace function public.admin_list_publication_queue(p_limit int default 50)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null
     or not public.user_has_founder_or_permission(v_actor, 'properties.review') then
    raise exception 'properties.review required';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.created_at asc)
    from (
      select
        r.id as review_id,
        r.property_id,
        r.status as review_status,
        r.kai_preliminary,
        r.pending_reason_codes,
        r.admin_notes,
        r.sla_deadline_at,
        r.escalated_at,
        r.created_at,
        p.code as property_code,
        p.title,
        p.province,
        p.city,
        p.cover_image_url,
        p.owner_id,
        p.lifecycle_status,
        p.status as marketplace_status
      from public.property_publication_reviews r
      join public.properties p on p.id = r.property_id
      where r.status in (
        'in_review', 'pending', 'corrections_requested',
        'technical_visit_requested', 'documents_requested'
      )
        and p.deleted_at is null
      order by r.created_at asc
      limit greatest(1, least(coalesce(p_limit, 50), 200))
    ) t
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_list_publication_queue(int) from public;
grant execute on function public.admin_list_publication_queue(int) to authenticated;

create or replace function public.list_my_notifications(p_limit int default 30)
returns setof public.user_notifications
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  return query
  select *
  from public.user_notifications
  where user_id = auth.uid()
  order by created_at desc
  limit greatest(1, least(coalesce(p_limit, 30), 100));
end;
$$;

revoke all on function public.list_my_notifications(int) from public;
grant execute on function public.list_my_notifications(int) to authenticated;

create or replace function public.mark_notifications_read(p_ids uuid[] default null)
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
  update public.user_notifications
  set read_at = timezone('utc', now())
  where user_id = auth.uid()
    and read_at is null
    and (p_ids is null or id = any (p_ids));
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.mark_notifications_read(uuid[]) from public;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

-- Housing visibility: active + (no review gate OR approved with visibility window).
-- Existing demo inventory (is_demo) remains visible for Beta coexistence.
create or replace function public.property_is_publicly_visible(p public.properties)
returns boolean
language sql
stable
as $$
  select
    p.deleted_at is null
    and p.status = 'active'
    and (
      coalesce(p.is_demo, false) = true
      or (
        coalesce(p.review_status, 'approved') = 'approved'
        and (
          p.general_visible_at is null
          or p.general_visible_at <= timezone('utc', now())
          or p.premium_visible_at <= timezone('utc', now())
        )
      )
    );
$$;

comment on function public.property_is_publicly_visible(public.properties) is
  'Beta 1.6 — demo inventory stays visible; real listings need approval + visibility window.';

