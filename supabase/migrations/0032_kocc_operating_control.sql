-- 0032_kocc_operating_control.sql
-- KOCC — Kuteka Operating Control Center — Sprint Beta 1
-- Adds an operational-status layer on top of platform_feature_flags so Super
-- Admin can manage per-module public status (beta / commercial / maintenance
-- / preparing / …) without ever exposing internal jargon (e.g. "Demo") to
-- end users. Aditivo (Core v1 freeze respeitado): apenas novas colunas,
-- tabela de auditoria e RPCs.

-- ═══════════════════════════════════════════════════════════════════════════
-- 0. platform_feature_flags — operating-control columns
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.platform_feature_flags
  add column if not exists operational_status text not null default 'beta_public',
  add column if not exists module_version text,
  add column if not exists activated_at timestamptz,
  add column if not exists notes text,
  add column if not exists allowed_roles text[] not null default '{}',
  add column if not exists allowed_countries text[] not null default '{}',
  add column if not exists environments text[] not null default '{production}';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'platform_feature_flags_operational_status_check'
  ) then
    alter table public.platform_feature_flags
      add constraint platform_feature_flags_operational_status_check
      check (operational_status in (
        'beta_public',
        'beta_private',
        'commercial_active',
        'preparing',
        'maintenance',
        'admin_only',
        'disabled',
        'invite_only'
      ));
  end if;
end $$;

comment on column public.platform_feature_flags.operational_status is
  'KOCC operating status. Never surface the raw value to end users — map it '
  'through publicModuleBadge()/status-labels.ts (apps/web/modules/kocc), which '
  'always returns a public label such as "Beta" or "Comercial activo" and '
  'never the word "Demo".';
comment on column public.platform_feature_flags.module_version is
  'Free-form module/build version shown in the KOCC panel (ex: "v1.2.0-beta").';
comment on column public.platform_feature_flags.activated_at is
  'When operational_status first became commercial_active. Set automatically by kocc_upsert_flag.';
comment on column public.platform_feature_flags.notes is
  'Internal Super Admin notes — never shown to end users.';
comment on column public.platform_feature_flags.allowed_roles is
  'Optional allow-list of role codes that may see/use this module while it is gated. Empty = all roles.';
comment on column public.platform_feature_flags.allowed_countries is
  'Optional allow-list of ISO-like country codes (ex: AO). Empty = all countries.';
comment on column public.platform_feature_flags.environments is
  'Environments where the module is active (production, staging, sandbox). Defaults to production.';

comment on table public.platform_feature_flags is
  'Service Health / KOCC — commercial + operational status per module. The '
  'boolean `enabled` remains the single source of truth for gate checks that '
  'only look at that column; kocc_upsert_flag keeps it in sync with '
  'operational_status (disabled/maintenance/admin_only/preparing force '
  'enabled=false) so legacy `select enabled from platform_feature_flags` '
  'checks continue to behave correctly without code changes.';

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. platform_feature_flag_audit — who changed what, before/after
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.platform_feature_flag_audit (
  id uuid primary key default gen_random_uuid(),
  flag_code text not null references public.platform_feature_flags (code) on delete cascade,
  actor_id uuid references auth.users (id),
  action text not null check (action in ('create', 'update')),
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists platform_feature_flag_audit_flag_idx
  on public.platform_feature_flag_audit (flag_code, created_at desc);
create index if not exists platform_feature_flag_audit_created_idx
  on public.platform_feature_flag_audit (created_at desc);

alter table public.platform_feature_flag_audit enable row level security;

drop policy if exists platform_feature_flag_audit_select on public.platform_feature_flag_audit;
create policy platform_feature_flag_audit_select
  on public.platform_feature_flag_audit for select to authenticated
  using (public.user_has_permission(auth.uid(), 'finance.manage'));

-- No direct client writes — only via kocc_upsert_flag (security definer).
revoke insert, update, delete on public.platform_feature_flag_audit from anon, authenticated;
grant select on public.platform_feature_flag_audit to authenticated;
grant insert, select on public.platform_feature_flag_audit to service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. kocc_upsert_flag — create/update a module flag + write audit row
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.kocc_upsert_flag(
  p_code text,
  p_label text,
  p_description text default null,
  p_enabled boolean default true,
  p_operational_status text default 'beta_public',
  p_module_version text default null,
  p_notes text default null,
  p_allowed_roles text[] default '{}',
  p_allowed_countries text[] default '{}',
  p_environments text[] default '{production}'
)
returns public.platform_feature_flags
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_before jsonb;
  v_after public.platform_feature_flags;
  v_enabled boolean;
  v_activated_at timestamptz;
begin
  if v_actor is null or not public.user_has_permission(v_actor, 'finance.manage') then
    raise exception 'finance.manage required';
  end if;

  if p_code is null or length(trim(p_code)) = 0 then
    raise exception 'code is required';
  end if;
  if p_label is null or length(trim(p_label)) = 0 then
    raise exception 'label is required';
  end if;

  -- Keep the legacy boolean gate in sync: these statuses must never leave a
  -- module reachable via `select enabled from platform_feature_flags`.
  if p_operational_status in ('disabled', 'maintenance', 'admin_only', 'preparing') then
    v_enabled := false;
  else
    v_enabled := coalesce(p_enabled, true);
  end if;

  select to_jsonb(f) into v_before from public.platform_feature_flags f where code = p_code;

  select case
    when p_operational_status = 'commercial_active' then coalesce(f.activated_at, timezone('utc', now()))
    else f.activated_at
  end into v_activated_at
  from public.platform_feature_flags f
  where f.code = p_code;

  if v_activated_at is null and p_operational_status = 'commercial_active' then
    v_activated_at := timezone('utc', now());
  end if;

  insert into public.platform_feature_flags (
    code, label, description, enabled, operational_status, module_version,
    notes, allowed_roles, allowed_countries, environments, activated_at,
    updated_at, updated_by
  ) values (
    p_code, p_label, p_description, v_enabled, p_operational_status, p_module_version,
    p_notes, coalesce(p_allowed_roles, '{}'), coalesce(p_allowed_countries, '{}'),
    coalesce(nullif(p_environments, '{}'), '{production}'), v_activated_at,
    timezone('utc', now()), v_actor
  )
  on conflict (code) do update
  set
    label = excluded.label,
    description = excluded.description,
    enabled = excluded.enabled,
    operational_status = excluded.operational_status,
    module_version = excluded.module_version,
    notes = excluded.notes,
    allowed_roles = excluded.allowed_roles,
    allowed_countries = excluded.allowed_countries,
    environments = excluded.environments,
    activated_at = excluded.activated_at,
    updated_at = timezone('utc', now()),
    updated_by = v_actor
  returning * into v_after;

  insert into public.platform_feature_flag_audit (flag_code, actor_id, action, before_state, after_state)
  values (
    p_code,
    v_actor,
    case when v_before is null then 'create' else 'update' end,
    v_before,
    to_jsonb(v_after)
  );

  return v_after;
end;
$$;

revoke all on function public.kocc_upsert_flag(
  text, text, text, boolean, text, text, text, text[], text[], text[]
) from public;
grant execute on function public.kocc_upsert_flag(
  text, text, text, boolean, text, text, text, text[], text[], text[]
) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. kocc_list_flags / kocc_list_audit — Super Admin reads (finance.manage)
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.kocc_list_flags()
returns setof public.platform_feature_flags
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.user_has_permission(auth.uid(), 'finance.manage') then
    raise exception 'finance.manage required';
  end if;
  return query select * from public.platform_feature_flags order by code;
end;
$$;

revoke all on function public.kocc_list_flags() from public;
grant execute on function public.kocc_list_flags() to authenticated;

create or replace function public.kocc_list_audit(p_limit int default 50)
returns setof public.platform_feature_flag_audit
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.user_has_permission(auth.uid(), 'finance.manage') then
    raise exception 'finance.manage required';
  end if;
  return query
    select *
    from public.platform_feature_flag_audit
    order by created_at desc
    limit greatest(1, least(coalesce(p_limit, 50), 200));
end;
$$;

revoke all on function public.kocc_list_audit(int) from public;
grant execute on function public.kocc_list_audit(int) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Seed / update known modules
-- ═══════════════════════════════════════════════════════════════════════════
-- Note: "assistencia" (per Sprint Beta 1 brief) is the existing
-- `assistencia_24h` flag created in 0028_assistencia_24h.sql — updated below
-- under its original code so gate checks (`where code = 'assistencia_24h'`)
-- keep working unchanged.

insert into public.platform_feature_flags (
  code, label, description, enabled, operational_status, allowed_countries
) values
  ('smart_move', 'Mudança Inteligente', 'Procura assistida por urgência', true, 'beta_public', '{AO}'),
  ('find_home', 'Encontrar Casa', 'Procura prioritária de habitação compatível', true, 'beta_public', '{AO}'),
  ('concierge', 'Concierge Kuteka', 'Pedidos assistidos de serviços à medida', true, 'beta_public', '{AO}'),
  ('garantia', 'Garantia Kuteka', 'Cobertura mensal opcional para arrendamentos', true, 'beta_public', '{AO}'),
  ('assistencia_24h', 'Assistência 24h', 'Assistência urgente ao imóvel, disponível 24 horas', true, 'beta_public', '{AO}'),
  ('marketplace', 'Marketplace de Prestadores', 'Rede de serviços para o lar', true, 'beta_public', '{AO}'),
  ('partner_plans', 'Planos Parceiro', 'Bronze / Silver / Gold', true, 'beta_public', '{AO}'),
  ('kuteka_plus', 'Kuteka Plus', 'Subscrição opcional', true, 'beta_public', '{AO}'),
  ('kuteka_pay', 'Kuteka Pay', 'Motor de pagamento unificado (sandbox + gateways Angola)', true, 'beta_public', '{AO}'),
  ('contracts', 'Contratos', 'Minutas e contratos entre Cliente, Parceiro e Agente', true, 'beta_public', '{AO}'),
  ('kai', 'KAI — Assistente Inteligente', 'Sugestões, regras e automações KAI', true, 'beta_public', '{AO}'),
  ('kis', 'KIS — Identidade Kuteka', 'Sistema de identidade e verificação Kuteka', true, 'beta_public', '{AO}'),
  ('campaigns', 'Campanhas', 'Créditos e descontos configuráveis (B2B2C)', true, 'beta_public', '{AO}'),
  ('notifications', 'Notificações', 'Lembretes e alertas por email/SMS/push', false, 'preparing', '{AO}'),
  ('trust', 'Confiança & Verificação', 'Centro de Confiança, KYC e reputação', true, 'beta_public', '{AO}'),
  ('housing', 'Habitação', 'Catálogo e detalhe de imóveis para arrendar/comprar', true, 'beta_public', '{AO}'),
  ('properties', 'Património', 'Gestão de imóveis por Parceiros/Agentes', true, 'beta_public', '{AO}'),
  ('agent', 'Agente Imobiliário', 'Painel e fluxo operacional do Agente', true, 'beta_public', '{AO}'),
  ('admin', 'Administração', 'Ferramentas internas de operação e suporte', true, 'admin_only', '{AO}')
on conflict (code) do update
set
  label = excluded.label,
  description = excluded.description,
  operational_status = coalesce(public.platform_feature_flags.operational_status, excluded.operational_status),
  allowed_countries = case
    when public.platform_feature_flags.allowed_countries = '{}' then excluded.allowed_countries
    else public.platform_feature_flags.allowed_countries
  end;
