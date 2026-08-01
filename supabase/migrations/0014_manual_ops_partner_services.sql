-- Manual Operacional Volume I — serviços Kuteka, gestão patrimonial, PDK, ciclo PP
-- Additive only. Does not alter Core UX shell/feed.

-- ─── Partner classification + ICK ───────────────────────────────────────────
alter table public.profiles
  add column if not exists partner_category text
    check (partner_category is null or partner_category in ('A','B','C','D','E','F','G')),
  add column if not exists ick_score numeric(5,2)
    check (ick_score is null or (ick_score >= 0 and ick_score <= 100)),
  add column if not exists partner_lifecycle text
    check (
      partner_lifecycle is null
      or partner_lifecycle in (
        'registado','em_verificacao','verificado','com_imovel_em_avaliacao',
        'imovel_publicado','em_negociacao','contrato_ativo','gestao_ativa',
        'suspensa','encerrada'
      )
    ),
  add column if not exists kid text unique;

comment on column public.profiles.partner_category is
  'Manual Cap.3: A Particular · B Investidor · C Empresa · D Promotor · E Estrangeiro · F Gestão Total · G Valorização';
comment on column public.profiles.ick_score is
  'Índice de Confiança Kuteka (0–100)';

-- ─── Property enrichment (Manual Cap.5) ─────────────────────────────────────
alter table public.properties
  add column if not exists municipality text,
  add column if not exists commune text,
  add column if not exists street_number text,
  add column if not exists conservation_state text
    check (
      conservation_state is null
      or conservation_state in ('excellent','good','fair','needs_work','ruin','under_construction')
    ),
  add column if not exists construction_status text
    check (
      construction_status is null
      or construction_status in ('complete','partial','not_started','needs_finish')
    ),
  add column if not exists management_level text
    check (
      management_level is null
      or management_level in (
        'announce_only','find_buyer','find_tenant','rental_management','full_management'
      )
    ),
  add column if not exists requested_services jsonb not null default '[]'::jsonb,
  add column if not exists renovation_requests jsonb not null default '[]'::jsonb,
  add column if not exists unfinished_intent text
    check (
      unfinished_intent is null
      or unfinished_intent in (
        'kuteka_finish','budget_only','technical_supervision','works_evaluation','none'
      )
    ),
  add column if not exists has_piped_water boolean,
  add column if not exists has_electricity boolean,
  add column if not exists has_generator boolean,
  add column if not exists has_internet boolean,
  add column if not exists has_security boolean,
  add column if not exists has_paved_street boolean,
  add column if not exists near_schools boolean,
  add column if not exists near_hospitals boolean,
  add column if not exists near_markets boolean,
  add column if not exists near_transport boolean,
  add column if not exists lifecycle_status text not null default 'em_preparacao'
    check (
      lifecycle_status in (
        'em_preparacao','em_analise_documental','em_inspecao_tecnica','em_avaliacao',
        'aprovado','publicado','em_negociacao','reservado','vendido','arrendado',
        'em_manutencao','temporariamente_indisponivel','arquivado'
      )
    ),
  add column if not exists kuteka_score numeric(5,2)
    check (kuteka_score is null or (kuteka_score >= 0 and kuteka_score <= 100)),
  add column if not exists last_maintenance_at timestamptz,
  add column if not exists last_inspection_at timestamptz,
  add column if not exists needs_renovation boolean not null default false,
  add column if not exists pdk_code text,
  add column if not exists owner_history jsonb not null default '[]'::jsonb,
  add column if not exists maintenance_history jsonb not null default '[]'::jsonb,
  add column if not exists inspection_history jsonb not null default '[]'::jsonb,
  add column if not exists valuation_history jsonb not null default '[]'::jsonb,
  add column if not exists legal_notes text,
  add column if not exists commercial_notes text;

-- Backfill PDK codes from existing codes
update public.properties
set pdk_code = coalesce(pdk_code, 'PDK-' || code)
where pdk_code is null;

-- Align published actives
update public.properties
set lifecycle_status = 'publicado'
where status = 'active' and lifecycle_status = 'em_preparacao';

-- ─── Kuteka ↔ Partner service contracts (Manual Cap.7) ──────────────────────
create table if not exists public.partner_service_contracts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  partner_id uuid not null references auth.users (id),
  property_id uuid references public.properties (id) on delete set null,
  service_type text not null
    check (service_type in (
      'intermediation_sale','intermediation_rent','full_management',
      'patrimonial_valuation','legal_admin','photography','technical_visit',
      'renovation','construction_finish','home_staging','cleaning',
      'maintenance','works_supervision','condo_admin','evaluation'
    )),
  exclusivity text not null default 'none'
    check (exclusivity in ('total','partial','none')),
  status text not null default 'draft'
    check (status in ('draft','pending_acceptance','active','completed','cancelled')),
  commission_notes text,
  terms_notes text,
  requested_services jsonb not null default '[]'::jsonb,
  is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

create index if not exists partner_service_contracts_partner_idx
  on public.partner_service_contracts (partner_id)
  where deleted_at is null;

drop trigger if exists partner_service_contracts_set_updated_at on public.partner_service_contracts;
create trigger partner_service_contracts_set_updated_at
before update on public.partner_service_contracts
for each row execute function public.set_updated_at();

alter table public.partner_service_contracts enable row level security;

drop policy if exists partner_service_contracts_select on public.partner_service_contracts;
create policy partner_service_contracts_select
  on public.partner_service_contracts for select to authenticated
  using (
    deleted_at is null
    and (
      partner_id = auth.uid()
      or public.user_has_permission(auth.uid(), 'admin.panel')
      or public.user_has_permission(auth.uid(), 'executive.panel')
      or public.user_has_permission(auth.uid(), 'agent.operate')
    )
  );

drop policy if exists partner_service_contracts_insert on public.partner_service_contracts;
create policy partner_service_contracts_insert
  on public.partner_service_contracts for insert to authenticated
  with check (
    partner_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'properties.manage')
  );

drop policy if exists partner_service_contracts_update on public.partner_service_contracts;
create policy partner_service_contracts_update
  on public.partner_service_contracts for update to authenticated
  using (
    deleted_at is null
    and (
      partner_id = auth.uid()
      or public.user_has_permission(auth.uid(), 'admin.panel')
    )
  );

-- ─── Technical evaluations (Manual Cap.6) ───────────────────────────────────
create table if not exists public.property_evaluations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  evaluator_id uuid references auth.users (id),
  status text not null default 'draft'
    check (status in ('draft','submitted','approved','rejected')),
  score_structure numeric(4,1),
  score_location numeric(4,1),
  score_documentation numeric(4,1),
  score_finishes numeric(4,1),
  score_profitability numeric(4,1),
  score_security numeric(4,1),
  kuteka_index numeric(5,2),
  suggested_price_aoa numeric(14,2),
  checklist jsonb not null default '{}'::jsonb,
  valuation_plan text,
  counter_proposal_notes text,
  report_notes text,
  is_demo boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists property_evaluations_property_idx
  on public.property_evaluations (property_id, created_at desc);

drop trigger if exists property_evaluations_set_updated_at on public.property_evaluations;
create trigger property_evaluations_set_updated_at
before update on public.property_evaluations
for each row execute function public.set_updated_at();

alter table public.property_evaluations enable row level security;

drop policy if exists property_evaluations_select on public.property_evaluations;
create policy property_evaluations_select
  on public.property_evaluations for select to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.deleted_at is null
        and (
          p.owner_id = auth.uid()
          or public.user_has_permission(auth.uid(), 'admin.panel')
          or public.user_has_permission(auth.uid(), 'agent.operate')
          or (p.status = 'active' and public.user_has_permission(auth.uid(), 'housing.explore'))
        )
    )
  );

drop policy if exists property_evaluations_insert on public.property_evaluations;
create policy property_evaluations_insert
  on public.property_evaluations for insert to authenticated
  with check (
    public.user_has_permission(auth.uid(), 'admin.panel')
    or public.user_has_permission(auth.uid(), 'agent.operate')
    or exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
  );

-- ─── Business rule helper: may publish? ─────────────────────────────────────
create or replace function public.property_requires_evaluation(p_services jsonb, p_management text)
returns boolean
language sql
immutable
as $$
  select
    coalesce(p_management, 'announce_only') in ('rental_management', 'full_management')
    or exists (
      select 1
      from jsonb_array_elements_text(coalesce(p_services, '[]'::jsonb)) s(val)
      where s.val in (
        'full_management','rental_management','evaluation','technical_visit',
        'construction_finish','renovation','works_supervision'
      )
    );
$$;

comment on function public.property_requires_evaluation(jsonb, text) is
  'Manual Cap.6/7: serviços de gestão/avaliação exigem avaliação antes de publicação plena.';

-- ─── Seed demo health + services for KTK-DEMO-0001 ─────────────────────────
create or replace function public.seed_manual_ops_demo()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prop uuid;
  v_partner uuid := 'a0000000-0000-4000-8000-0000000000d1';
begin
  update public.profiles
  set
    partner_category = coalesce(partner_category, 'B'),
    ick_score = coalesce(ick_score, 86),
    partner_lifecycle = coalesce(partner_lifecycle, 'imovel_publicado'),
    kid = coalesce(kid, 'KID-PP-' || substr(id::text, 1, 8))
  where id = v_partner;

  select id into v_prop from public.properties where code = 'KTK-DEMO-0001' and deleted_at is null limit 1;
  if v_prop is null then
    return;
  end if;

  update public.properties
  set
    commune = coalesce(commune, 'Belas'),
    municipality = coalesce(municipality, 'Belas'),
    street_number = coalesce(street_number, '12'),
    conservation_state = coalesce(conservation_state, 'good'),
    construction_status = coalesce(construction_status, 'complete'),
    management_level = coalesce(management_level, 'full_management'),
    requested_services = case
      when jsonb_array_length(coalesce(requested_services, '[]'::jsonb)) > 0 then requested_services
      else '["announce","find_buyer","full_management","evaluation","photography"]'::jsonb
    end,
    has_piped_water = coalesce(has_piped_water, true),
    has_electricity = coalesce(has_electricity, true),
    has_generator = coalesce(has_generator, true),
    has_internet = coalesce(has_internet, true),
    has_security = coalesce(has_security, true),
    has_paved_street = coalesce(has_paved_street, true),
    near_schools = coalesce(near_schools, true),
    near_hospitals = coalesce(near_hospitals, true),
    near_markets = coalesce(near_markets, true),
    near_transport = coalesce(near_transport, true),
    kuteka_score = coalesce(kuteka_score, 88),
    last_maintenance_at = coalesce(last_maintenance_at, timezone('utc', now()) - interval '90 days'),
    last_inspection_at = coalesce(last_inspection_at, timezone('utc', now()) - interval '30 days'),
    needs_renovation = coalesce(needs_renovation, false),
    pdk_code = coalesce(pdk_code, 'PDK-KTK-DEMO-0001'),
    maintenance_history = case
      when jsonb_array_length(coalesce(maintenance_history, '[]'::jsonb)) > 0 then maintenance_history
      else '[{"at":"2026-04-01","note":"Pintura exterior"},{"at":"2025-11-12","note":"Revisão eléctrica"}]'::jsonb
    end,
    inspection_history = case
      when jsonb_array_length(coalesce(inspection_history, '[]'::jsonb)) > 0 then inspection_history
      else '[{"at":"2026-06-15","note":"Inspeção técnica Agente — habitável"}]'::jsonb
    end,
    valuation_history = case
      when jsonb_array_length(coalesce(valuation_history, '[]'::jsonb)) > 0 then valuation_history
      else '[{"at":"2026-06-20","score":88,"price_aoa":185000000}]'::jsonb
    end,
    commercial_notes = coalesce(commercial_notes, 'Procura elevada em Talatona. Estratégia: venda premium.'),
    legal_notes = coalesce(legal_notes, 'Documentação em análise / título apresentado (demo).'),
    lifecycle_status = 'publicado'
  where id = v_prop;

  insert into public.partner_service_contracts (
    id, code, partner_id, property_id, service_type, exclusivity, status,
    commission_notes, terms_notes, requested_services, is_demo, created_by, updated_by
  )
  values (
    'c1111111-1111-4111-8111-111111111001',
    'KTK-SVC-0001',
    v_partner,
    v_prop,
    'full_management',
    'partial',
    'active',
    'Comissão conforme tabela Kuteka (demo).',
    'Contrato de serviços Kuteka ↔ Parceiro Patrimonial (demo Manual Cap.7).',
    '["announce","find_buyer","full_management","evaluation"]'::jsonb,
    true,
    v_partner,
    v_partner
  )
  on conflict (code) do nothing;

  insert into public.property_evaluations (
    id, property_id, evaluator_id, status,
    score_structure, score_location, score_documentation, score_finishes,
    score_profitability, score_security, kuteka_index, suggested_price_aoa,
    checklist, valuation_plan, report_notes, is_demo
  )
  values (
    'd1111111-1111-4111-8111-111111111001',
    v_prop,
    v_partner,
    'approved',
    9, 8.5, 9, 8, 8.5, 9, 88, 185000000,
    '{"humidade":"ok","eletrica":"ok","canalizacao":"ok","habitabilidade":"ok"}'::jsonb,
    'Manutenção preventiva da pintura e jardinagem no próximo trimestre.',
    'Relatório oficial de avaliação demo — apto para comercialização.',
    true
  )
  on conflict do nothing;
end;
$$;

revoke all on function public.seed_manual_ops_demo() from public;
grant execute on function public.seed_manual_ops_demo() to authenticated;

select public.seed_manual_ops_demo();
