-- 0038_lifecycle_social_founder_ops.sql
-- Sprint Beta 1.6 — fecho do gate Beta 2:
-- 1) Ciclo completo do imóvel + timeline/KOS
-- 2) Social na ficha (like/favorito/comentário/pergunta)
-- 3) Founder bootstrap + gestão institucional + email seguro + contas demo

create extension if not exists pgcrypto;

-- ═══════════════════════════════════════════════════════════════════════════
-- 0. Expand lifecycle_status for full property life cycle
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.properties drop constraint if exists properties_lifecycle_status_check;

alter table public.properties
  add constraint properties_lifecycle_status_check
  check (lifecycle_status in (
    'rascunho',
    'submetido',
    'em_analise_kai',
    'em_analise_admin',
    'pendente',
    'correcoes',
    'em_preparacao',
    'em_analise_documental',
    'em_inspecao_tecnica',
    'em_avaliacao',
    'aprovado',
    'janela_premium',
    'publicado',
    'em_negociacao',
    'reservado',
    'contrato',
    'vendido',
    'arrendado',
    'em_utilizacao',
    'libertacao_prevista',
    'disponivel_novamente',
    'em_manutencao',
    'temporariamente_indisponivel',
    'arquivado'
  ));

-- Map legacy → canonical where helpful (keep old values accepted above)
update public.properties
set lifecycle_status = 'em_analise_admin'
where review_status = 'in_review'
  and lifecycle_status in ('em_analise_documental', 'em_preparacao');

comment on column public.properties.lifecycle_status is
  'Ciclo completo do imóvel (Beta 1.6): rascunho→…→publicado→contrato→arquivado.';

-- Demo / system accounts marker on profiles
alter table public.profiles
  add column if not exists is_system_demo boolean not null default false,
  add column if not exists account_kind text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_account_kind_check'
  ) then
    alter table public.profiles
      add constraint profiles_account_kind_check
      check (
        account_kind is null
        or account_kind in ('standard', 'system_demo', 'founder', 'institutional')
      );
  end if;
end $$;

update public.profiles p
set is_system_demo = true,
    account_kind = 'system_demo'
from auth.users u
where u.id = p.id
  and u.email ilike 'demo.%@kuteka.local';

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Social — likes, favorites, comments/questions
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.property_likes (
  property_id uuid not null references public.properties (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (property_id, user_id)
);

create table if not exists public.property_favorites (
  property_id uuid not null references public.properties (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (property_id, user_id)
);

create table if not exists public.property_social_posts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('comment', 'question', 'answer')),
  parent_id uuid references public.property_social_posts (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  author_role text,
  is_official boolean not null default false,
  moderation_status text not null default 'visible'
    check (moderation_status in ('visible', 'hidden', 'removed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists property_social_posts_property_idx
  on public.property_social_posts (property_id, created_at desc);
create index if not exists property_likes_property_idx on public.property_likes (property_id);
create index if not exists property_favorites_user_idx on public.property_favorites (user_id);

alter table public.property_likes enable row level security;
alter table public.property_favorites enable row level security;
alter table public.property_social_posts enable row level security;

drop policy if exists property_likes_select on public.property_likes;
create policy property_likes_select on public.property_likes
  for select to authenticated using (true);
drop policy if exists property_likes_write on public.property_likes;
create policy property_likes_write on public.property_likes
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists property_favorites_select on public.property_favorites;
create policy property_favorites_select on public.property_favorites
  for select to authenticated using (user_id = auth.uid() or true);
drop policy if exists property_favorites_write on public.property_favorites;
create policy property_favorites_write on public.property_favorites
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists property_social_posts_select on public.property_social_posts;
create policy property_social_posts_select on public.property_social_posts
  for select to authenticated
  using (
    moderation_status = 'visible'
    or author_id = auth.uid()
    or public.user_has_founder_or_permission(auth.uid(), 'moderation.manage')
    or public.user_has_permission(auth.uid(), 'admin.panel')
  );

drop policy if exists property_social_posts_insert on public.property_social_posts;
create policy property_social_posts_insert on public.property_social_posts
  for insert to authenticated
  with check (author_id = auth.uid());

drop policy if exists property_social_posts_update_own on public.property_social_posts;
create policy property_social_posts_update_own on public.property_social_posts
  for update to authenticated
  using (
    author_id = auth.uid()
    or public.user_has_founder_or_permission(auth.uid(), 'moderation.manage')
  );

grant select, insert, update, delete on public.property_likes to authenticated;
grant select, insert, update, delete on public.property_favorites to authenticated;
grant select, insert, update on public.property_social_posts to authenticated;

create or replace function public.property_social_summary(p_property_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_likes int;
  v_favs int;
  v_comments int;
  v_questions int;
  v_liked boolean := false;
  v_faved boolean := false;
begin
  select count(*)::int into v_likes from public.property_likes where property_id = p_property_id;
  select count(*)::int into v_favs from public.property_favorites where property_id = p_property_id;
  select count(*)::int into v_comments
  from public.property_social_posts
  where property_id = p_property_id and kind = 'comment' and moderation_status = 'visible';
  select count(*)::int into v_questions
  from public.property_social_posts
  where property_id = p_property_id and kind = 'question' and moderation_status = 'visible';

  if v_actor is not null then
    v_liked := exists (
      select 1 from public.property_likes where property_id = p_property_id and user_id = v_actor
    );
    v_faved := exists (
      select 1 from public.property_favorites where property_id = p_property_id and user_id = v_actor
    );
  end if;

  return jsonb_build_object(
    'likes', v_likes,
    'favorites', v_favs,
    'comments', v_comments,
    'questions', v_questions,
    'likedByMe', v_liked,
    'favoritedByMe', v_faved
  );
end;
$$;

revoke all on function public.property_social_summary(uuid) from public;
grant execute on function public.property_social_summary(uuid) to authenticated;

create or replace function public.toggle_property_like(p_property_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'authentication required'; end if;
  if exists (
    select 1 from public.property_likes where property_id = p_property_id and user_id = v_actor
  ) then
    delete from public.property_likes where property_id = p_property_id and user_id = v_actor;
  else
    insert into public.property_likes (property_id, user_id) values (p_property_id, v_actor);
  end if;
  return public.property_social_summary(p_property_id);
end;
$$;

create or replace function public.toggle_property_favorite(p_property_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then raise exception 'authentication required'; end if;
  if exists (
    select 1 from public.property_favorites where property_id = p_property_id and user_id = v_actor
  ) then
    delete from public.property_favorites where property_id = p_property_id and user_id = v_actor;
  else
    insert into public.property_favorites (property_id, user_id) values (p_property_id, v_actor);
  end if;
  return public.property_social_summary(p_property_id);
end;
$$;

revoke all on function public.toggle_property_like(uuid) from public;
revoke all on function public.toggle_property_favorite(uuid) from public;
grant execute on function public.toggle_property_like(uuid) to authenticated;
grant execute on function public.toggle_property_favorite(uuid) to authenticated;

create or replace function public.create_property_social_post(
  p_property_id uuid,
  p_kind text,
  p_body text,
  p_parent_id uuid default null
)
returns public.property_social_posts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_owner uuid;
  v_role text;
  v_official boolean := false;
  v_row public.property_social_posts;
begin
  if v_actor is null then raise exception 'authentication required'; end if;
  if p_kind not in ('comment', 'question', 'answer') then
    raise exception 'invalid kind';
  end if;
  if p_kind = 'answer' and p_parent_id is null then
    raise exception 'answer requires parent';
  end if;

  select owner_id into v_owner from public.properties where id = p_property_id and deleted_at is null;
  if v_owner is null then raise exception 'property not found'; end if;

  if public.user_has_permission(v_actor, 'admin.panel')
     or public.is_founder(v_actor) then
    v_role := 'kuteka';
    v_official := true;
  elsif v_actor = v_owner then
    v_role := 'partner';
    v_official := true;
  elsif public.user_has_permission(v_actor, 'agent.operate') then
    v_role := 'agent';
    v_official := true;
  else
    v_role := 'client';
  end if;

  insert into public.property_social_posts (
    property_id, author_id, kind, parent_id, body, author_role, is_official
  ) values (
    p_property_id, v_actor, p_kind, p_parent_id, trim(p_body), v_role, v_official
  )
  returning * into v_row;

  perform public.record_user_activity(
    v_owner,
    'property_social_' || p_kind,
    case p_kind
      when 'question' then 'Nova pergunta no património'
      when 'answer' then 'Nova resposta no património'
      else 'Novo comentário no património'
    end,
    left(trim(p_body), 120),
    'property',
    p_property_id::text,
    jsonb_build_object('postId', v_row.id, 'kind', p_kind)
  );

  return v_row;
end;
$$;

revoke all on function public.create_property_social_post(uuid, text, text, uuid) from public;
grant execute on function public.create_property_social_post(uuid, text, text, uuid) to authenticated;

create or replace function public.list_property_social_posts(p_property_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.created_at asc)
    from (
      select
        s.id, s.property_id, s.author_id, s.kind, s.parent_id, s.body,
        s.author_role, s.is_official, s.moderation_status, s.created_at,
        p.display_name as author_name
      from public.property_social_posts s
      left join public.profiles p on p.id = s.author_id
      where s.property_id = p_property_id
        and (
          s.moderation_status = 'visible'
          or s.author_id = auth.uid()
          or public.user_has_permission(auth.uid(), 'admin.panel')
        )
      order by s.created_at asc
      limit 200
    ) t
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.list_property_social_posts(uuid) from public;
grant execute on function public.list_property_social_posts(uuid) to authenticated;

-- Report social post → content_reports
create or replace function public.report_property_social_post(
  p_post_id uuid,
  p_reason_code text,
  p_details text default null
)
returns public.content_reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prop uuid;
begin
  select property_id into v_prop from public.property_social_posts where id = p_post_id;
  if v_prop is null then raise exception 'post not found'; end if;
  return public.submit_content_report(
    case (select kind from public.property_social_posts where id = p_post_id)
      when 'question' then 'question'
      else 'comment'
    end,
    p_post_id::text,
    p_reason_code,
    p_details,
    v_prop
  );
end;
$$;

revoke all on function public.report_property_social_post(uuid, text, text) from public;
grant execute on function public.report_property_social_post(uuid, text, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Sync lifecycle on publication + contracts → timeline + activity
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.sync_property_lifecycle_from_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_life text;
begin
  v_life := case new.status
    when 'in_review' then 'em_analise_admin'
    when 'pending' then 'pendente'
    when 'corrections_requested' then 'correcoes'
    when 'technical_visit_requested' then 'em_inspecao_tecnica'
    when 'documents_requested' then 'em_analise_documental'
    when 'approved' then
      case
        when exists (
          select 1 from public.properties p
          where p.id = new.property_id
            and p.general_visible_at is not null
            and p.general_visible_at > timezone('utc', now())
        ) then 'janela_premium'
        else 'publicado'
      end
    when 'rejected' then 'arquivado'
    else null
  end;

  if v_life is not null then
    update public.properties
    set lifecycle_status = v_life,
        updated_at = timezone('utc', now())
    where id = new.property_id;
  end if;
  return new;
end;
$$;

drop trigger if exists property_publication_reviews_sync_lifecycle on public.property_publication_reviews;
create trigger property_publication_reviews_sync_lifecycle
after insert or update of status on public.property_publication_reviews
for each row execute function public.sync_property_lifecycle_from_review();

-- Promote janela_premium → publicado when general window opens (callable by cron/client)
create or replace function public.promote_premium_window_properties()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update public.properties
  set lifecycle_status = 'publicado',
      updated_at = timezone('utc', now())
  where lifecycle_status = 'janela_premium'
    and general_visible_at is not null
    and general_visible_at <= timezone('utc', now())
    and status = 'active'
    and deleted_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.promote_premium_window_properties() from public;
grant execute on function public.promote_premium_window_properties() to authenticated, service_role;

-- When contract becomes active/completed, advance lifecycle
create or replace function public.sync_property_lifecycle_from_contract()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.property_id is null then
    return new;
  end if;

  if new.status = 'pending_acceptance' then
    update public.properties
    set lifecycle_status = 'contrato', updated_at = timezone('utc', now())
    where id = new.property_id and deleted_at is null;
    insert into public.property_timeline_events (property_id, event_type, title, summary, actor_id, contract_id)
    values (new.property_id, 'contract_started', 'Contrato iniciado', new.title, auth.uid(), new.id);
    if new.partner_id is not null then
      perform public.record_user_activity(new.partner_id, 'first_or_next_contract', 'Contrato iniciado', new.title, 'contract', new.id::text, '{}'::jsonb);
    end if;
    if new.client_id is not null then
      perform public.record_user_activity(new.client_id, 'contract_started', 'Contrato iniciado', new.title, 'contract', new.id::text, '{}'::jsonb);
    end if;
  elsif new.status = 'active' then
    update public.properties
    set lifecycle_status = case new.purpose
      when 'sale' then 'vendido'
      else 'arrendado'
    end,
    updated_at = timezone('utc', now())
    where id = new.property_id and deleted_at is null;
    insert into public.property_timeline_events (property_id, event_type, title, summary, actor_id, contract_id)
    values (
      new.property_id,
      'contract_active',
      case when new.purpose = 'sale' then 'Imóvel vendido' else 'Imóvel arrendado' end,
      new.title,
      auth.uid(),
      new.id
    );
  elsif new.status = 'completed' then
    update public.properties
    set lifecycle_status = 'em_utilizacao', updated_at = timezone('utc', now())
    where id = new.property_id and deleted_at is null
      and lifecycle_status in ('arrendado', 'vendido', 'contrato', 'publicado', 'reservado');
    insert into public.property_timeline_events (property_id, event_type, title, summary, actor_id, contract_id)
    values (new.property_id, 'contract_completed', 'Contrato concluído', new.title, auth.uid(), new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists property_contracts_sync_lifecycle on public.property_contracts;
create trigger property_contracts_sync_lifecycle
after insert or update of status on public.property_contracts
for each row execute function public.sync_property_lifecycle_from_contract();

-- Update submit to set submetido → em_analise_kai → em_analise_admin
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
  if v_actor is null then raise exception 'authentication required'; end if;

  select owner_id, title into v_owner, v_title
  from public.properties where id = p_property_id and deleted_at is null;
  if v_owner is null then raise exception 'property not found'; end if;
  if v_owner <> v_actor
     and not public.user_has_founder_or_permission(v_actor, 'properties.review') then
    raise exception 'not allowed';
  end if;

  update public.properties
  set lifecycle_status = 'submetido',
      status = 'draft',
      review_status = 'in_review',
      submitted_for_review_at = timezone('utc', now()),
      general_visible_at = null,
      premium_visible_at = null,
      updated_at = timezone('utc', now()),
      updated_by = v_actor
  where id = p_property_id;

  insert into public.property_timeline_events (property_id, event_type, title, summary, actor_id)
  values (p_property_id, 'submitted', 'Submetido para publicação', 'Aguarda análise KAI e Administração.', v_actor);

  v_kai := public.kai_preliminary_property_check(p_property_id);

  update public.properties
  set lifecycle_status = 'em_analise_kai', updated_at = timezone('utc', now())
  where id = p_property_id;

  insert into public.property_timeline_events (property_id, event_type, title, summary, actor_id, metadata)
  values (
    p_property_id, 'kai_analysis', 'Análise preliminar KAI',
    'Score ' || coalesce(v_kai->>'score', '—'),
    v_actor, jsonb_build_object('kai', v_kai)
  );

  update public.properties
  set lifecycle_status = 'em_analise_admin', updated_at = timezone('utc', now())
  where id = p_property_id;

  insert into public.property_publication_reviews (
    property_id, status, kai_preliminary, sla_deadline_at
  ) values (
    p_property_id, 'in_review', v_kai,
    public.add_business_hours_wat(timezone('utc', now()), 12)
  )
  returning * into v_row;

  insert into public.property_timeline_events (property_id, event_type, title, summary, actor_id, metadata)
  values (
    p_property_id, 'admin_review', 'Em análise pelo Administrador',
    'Fila de publicação KOCC / Admin.',
    v_actor, jsonb_build_object('reviewId', v_row.id)
  );

  perform public.record_user_activity(
    v_owner, 'publication_submitted', 'Património submetido para análise',
    coalesce(v_title, 'Património'), 'property', p_property_id::text,
    jsonb_build_object('reviewId', v_row.id)
  );

  perform public.notify_user(
    v_owner, 'publication_submitted', 'Património em análise',
    'A sua publicação passou pela KAI e entrou na fila de revisão da Administração.',
    '/app/patrimonios/detalhe?id=' || p_property_id::text,
    jsonb_build_object('propertyId', p_property_id, 'reviewId', v_row.id)
  );

  perform public.write_audit_event(
    'property_publication_submitted', 'property', p_property_id::text,
    jsonb_build_object('reviewId', v_row.id, 'kai', v_kai),
    null, null, to_jsonb(v_row), null, null
  );

  return v_row;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Founder bootstrap (one-time) + institutional promotion
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.founder_bootstrap_state (
  id int primary key default 1 check (id = 1),
  completed_at timestamptz,
  completed_by uuid references auth.users (id),
  notes text
);

insert into public.founder_bootstrap_state (id) values (1)
on conflict (id) do nothing;

alter table public.founder_bootstrap_state enable row level security;
drop policy if exists founder_bootstrap_state_select on public.founder_bootstrap_state;
create policy founder_bootstrap_state_select on public.founder_bootstrap_state
  for select to authenticated using (true);
grant select on public.founder_bootstrap_state to authenticated;

create or replace function public.founder_bootstrap_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'bootstrapOpen', not exists (
      select 1 from public.founders where is_owner = true
    ) and exists (
      select 1 from public.founder_bootstrap_state
      where id = 1 and completed_at is null
    ),
    'hasOwner', exists (select 1 from public.founders where is_owner = true),
    'completedAt', (select completed_at from public.founder_bootstrap_state where id = 1)
  );
$$;

revoke all on function public.founder_bootstrap_status() from public;
grant execute on function public.founder_bootstrap_status() to authenticated;

create or replace function public.founder_bootstrap_claim(
  p_display_label text default 'Founder / Owner'
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
  if v_actor is null then raise exception 'authentication required'; end if;

  if exists (select 1 from public.founders where is_owner = true) then
    raise exception 'founder bootstrap already completed';
  end if;
  if exists (
    select 1 from public.founder_bootstrap_state where id = 1 and completed_at is not null
  ) then
    raise exception 'founder bootstrap permanently locked';
  end if;

  -- Block demo accounts from becoming production Founder
  if exists (
    select 1 from auth.users u
    where u.id = v_actor and u.email ilike 'demo.%@kuteka.local'
  ) then
    raise exception 'system demo accounts cannot become Founder';
  end if;

  insert into public.founders (user_id, is_founder, is_owner, display_label, created_by)
  values (v_actor, true, true, coalesce(nullif(trim(p_display_label), ''), 'Founder / Owner'), v_actor)
  on conflict (user_id) do update
  set is_founder = true, is_owner = true,
      display_label = coalesce(excluded.display_label, public.founders.display_label)
  returning * into v_row;

  insert into public.user_roles (user_id, role_id)
  select v_actor, r.id from public.roles r where r.code = 'super_administrator'
  on conflict do nothing;

  update public.profiles
  set account_kind = 'founder', updated_at = timezone('utc', now())
  where id = v_actor;

  update public.founder_bootstrap_state
  set completed_at = timezone('utc', now()), completed_by = v_actor,
      notes = 'First Founder/Owner bootstrap — permanently locked'
  where id = 1;

  perform public.record_user_activity(
    v_actor, 'founder_bootstrap', 'Founder Owner criado',
    'Bootstrap institucional Kuteka', 'founder', v_actor::text, '{}'::jsonb
  );

  perform public.write_audit_event(
    'founder.bootstrap', 'founder', v_actor::text,
    jsonb_build_object('label', v_row.display_label),
    'Bootstrap do primeiro Founder/Owner — mecanismo bloqueado a partir de agora',
    null, to_jsonb(v_row), null, null
  );

  return v_row;
end;
$$;

revoke all on function public.founder_bootstrap_claim(text) from public;
grant execute on function public.founder_bootstrap_claim(text) to authenticated;

-- Institutional role codes that Founder/Owner may grant
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
    'founder', 'co_founder', 'super_administrator', 'administrator', 'supervisor', 'auditor'
  ) then
    raise exception 'invalid target role';
  end if;
  -- Only Owner can create another Owner/Founder with is_owner
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
    -- Founders also get Super Admin surface access
    select id into v_role_id from public.roles where code = 'super_administrator';
    if v_role_id is not null then
      insert into public.user_roles (user_id, role_id, assigned_by)
      values (p_user_id, v_role_id, v_actor)
      on conflict do nothing;
    end if;
  elsif p_target_role = 'co_founder' then
    insert into public.founders (user_id, is_founder, is_owner, display_label, created_by)
    values (p_user_id, true, false, 'Co-Founder', v_actor)
    on conflict (user_id) do update set is_founder = true, display_label = 'Co-Founder';
    select id into v_role_id from public.roles where code = 'co_founder';
    if v_role_id is not null then
      insert into public.user_roles (user_id, role_id, assigned_by)
      values (p_user_id, v_role_id, v_actor)
      on conflict do nothing;
    end if;
    select id into v_role_id from public.roles where code = 'super_administrator';
    if v_role_id is not null then
      insert into public.user_roles (user_id, role_id, assigned_by)
      values (p_user_id, v_role_id, v_actor)
      on conflict do nothing;
    end if;
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

create or replace function public.list_institutional_directory()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null
     or not (
       public.is_founder(auth.uid())
       or public.is_platform_owner(auth.uid())
       or public.user_has_permission(auth.uid(), 'finance.manage')
     ) then
    raise exception 'founder or finance.manage required';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t)::jsonb order by t.sort_rank, t.display_name)
    from (
      select
        p.id as user_id,
        p.display_name,
        u.email,
        p.is_system_demo,
        p.account_kind,
        coalesce(
          (select array_agg(r.code order by r.code)
           from public.user_roles ur join public.roles r on r.id = ur.role_id
           where ur.user_id = p.id),
          '{}'::text[]
        ) as roles,
        exists (select 1 from public.founders f where f.user_id = p.id and f.is_founder) as is_founder,
        exists (select 1 from public.founders f where f.user_id = p.id and f.is_owner) as is_owner,
        case
          when exists (select 1 from public.founders f where f.user_id = p.id and f.is_owner) then 0
          when exists (select 1 from public.founders f where f.user_id = p.id) then 1
          when exists (
            select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
            where ur.user_id = p.id and r.code = 'super_administrator'
          ) then 2
          when exists (
            select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
            where ur.user_id = p.id and r.code = 'administrator'
          ) then 3
          else 9
        end as sort_rank
      from public.profiles p
      join auth.users u on u.id = p.id
      where p.deleted_at is null
        and (
          exists (select 1 from public.founders f where f.user_id = p.id)
          or exists (
            select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
            where ur.user_id = p.id
              and r.code in (
                'super_administrator', 'administrator', 'supervisor',
                'auditor', 'co_founder', 'certified_agent'
              )
          )
          or p.is_system_demo = true
        )
    ) t
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.list_institutional_directory() from public;
grant execute on function public.list_institutional_directory() to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Secure email change (dual confirmation)
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.email_change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  old_email text not null,
  new_email text not null,
  old_code_hash text not null,
  new_code_hash text not null,
  old_confirmed_at timestamptz,
  new_confirmed_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists email_change_requests_user_idx
  on public.email_change_requests (user_id, created_at desc);

alter table public.email_change_requests enable row level security;
drop policy if exists email_change_requests_select_own on public.email_change_requests;
create policy email_change_requests_select_own on public.email_change_requests
  for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.email_change_requests from anon, authenticated;
grant select on public.email_change_requests to authenticated;
grant all on public.email_change_requests to service_role;

create or replace function public.request_email_change(p_new_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_old text;
  v_old_code text := lpad((floor(random() * 1000000))::int::text, 6, '0');
  v_new_code text := lpad((floor(random() * 1000000))::int::text, 6, '0');
  v_id uuid;
begin
  if v_actor is null then raise exception 'authentication required'; end if;
  if p_new_email is null or position('@' in p_new_email) = 0 then
    raise exception 'invalid email';
  end if;
  if exists (
    select 1 from auth.users where id = v_actor and email ilike 'demo.%@kuteka.local'
  ) then
    raise exception 'system demo accounts cannot change email via this flow';
  end if;

  select email into v_old from auth.users where id = v_actor;
  if lower(v_old) = lower(trim(p_new_email)) then
    raise exception 'new email must differ';
  end if;

  insert into public.email_change_requests (
    user_id, old_email, new_email, old_code_hash, new_code_hash, expires_at
  ) values (
    v_actor, v_old, lower(trim(p_new_email)),
    encode(digest(v_old_code, 'sha256'), 'hex'),
    encode(digest(v_new_code, 'sha256'), 'hex'),
    timezone('utc', now()) + interval '30 minutes'
  )
  returning id into v_id;

  perform public.write_audit_event(
    'email_change.requested', 'user', v_actor::text,
    jsonb_build_object('newEmail', lower(trim(p_new_email)), 'requestId', v_id),
    'Pedido de alteração de email',
    jsonb_build_object('email', v_old),
    jsonb_build_object('email', lower(trim(p_new_email))),
    null, null
  );

  -- Codes returned once for client delivery via configured SMTP (or display in beta).
  return jsonb_build_object(
    'requestId', v_id,
    'expiresAt', timezone('utc', now()) + interval '30 minutes',
    'oldCode', v_old_code,
    'newCode', v_new_code,
    'delivery', 'beta_inline'
  );
end;
$$;

revoke all on function public.request_email_change(text) from public;
grant execute on function public.request_email_change(text) to authenticated;

create or replace function public.confirm_email_change(
  p_request_id uuid,
  p_old_code text,
  p_new_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_req public.email_change_requests%rowtype;
begin
  if v_actor is null then raise exception 'authentication required'; end if;

  select * into v_req from public.email_change_requests
  where id = p_request_id and user_id = v_actor;

  if v_req.id is null then raise exception 'request not found'; end if;
  if v_req.completed_at is not null then raise exception 'already completed'; end if;
  if v_req.expires_at < timezone('utc', now()) then raise exception 'expired'; end if;

  if encode(digest(trim(p_old_code), 'sha256'), 'hex') <> v_req.old_code_hash then
    raise exception 'invalid old email code';
  end if;
  if encode(digest(trim(p_new_code), 'sha256'), 'hex') <> v_req.new_code_hash then
    raise exception 'invalid new email code';
  end if;

  update auth.users set email = v_req.new_email, email_confirmed_at = timezone('utc', now())
  where id = v_actor;

  update public.email_change_requests
  set old_confirmed_at = timezone('utc', now()),
      new_confirmed_at = timezone('utc', now()),
      completed_at = timezone('utc', now())
  where id = p_request_id;

  perform public.record_user_activity(
    v_actor, 'email_changed', 'Email actualizado',
    v_req.new_email, 'user', v_actor::text, '{}'::jsonb
  );

  perform public.write_audit_event(
    'email_change.completed', 'user', v_actor::text,
    jsonb_build_object('requestId', p_request_id),
    'Alteração de email confirmada (dupla verificação)',
    jsonb_build_object('email', v_req.old_email),
    jsonb_build_object('email', v_req.new_email),
    null, null
  );

  return jsonb_build_object('ok', true, 'email', v_req.new_email);
end;
$$;

revoke all on function public.confirm_email_change(uuid, text, text) from public;
grant execute on function public.confirm_email_change(uuid, text, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. KOS Analytics — lifecycle distribution
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.kos_ops_metrics()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_base jsonb;
  v_lifecycle jsonb;
  v_likes int;
  v_social int;
begin
  if v_actor is null
     or not (
       public.user_has_founder_or_permission(v_actor, 'audit.read')
       or public.user_has_permission(v_actor, 'admin.panel')
       or public.user_has_permission(v_actor, 'finance.manage')
     ) then
    raise exception 'admin metrics required';
  end if;

  -- Reuse prior metrics by recomputing core set (keep function self-contained)
  select count(*)::int into v_likes from public.property_likes;
  select count(*)::int into v_social
  from public.property_social_posts where moderation_status = 'visible';

  select coalesce(jsonb_object_agg(lifecycle_status, cnt), '{}'::jsonb)
  into v_lifecycle
  from (
    select lifecycle_status, count(*)::int as cnt
    from public.properties
    where deleted_at is null
    group by lifecycle_status
  ) s;

  return jsonb_build_object(
    'generatedAt', timezone('utc', now()),
    'publicationInReview', (
      select count(*)::int from public.property_publication_reviews
      where status in (
        'in_review', 'pending', 'corrections_requested',
        'technical_visit_requested', 'documents_requested'
      )
    ),
    'publicationOverdueSla', (
      select count(*)::int from public.property_publication_reviews
      where status in (
        'in_review', 'pending', 'corrections_requested',
        'technical_visit_requested', 'documents_requested'
      )
        and sla_deadline_at is not null
        and sla_deadline_at < timezone('utc', now())
    ),
    'publicationApproved7d', (
      select count(*)::int from public.property_publication_reviews
      where status = 'approved' and decided_at >= timezone('utc', now()) - interval '7 days'
    ),
    'publicationRejected7d', (
      select count(*)::int from public.property_publication_reviews
      where status = 'rejected' and decided_at >= timezone('utc', now()) - interval '7 days'
    ),
    'avgApprovalHours30d', coalesce((
      select round(avg(extract(epoch from (decided_at - created_at)) / 3600.0)::numeric, 1)
      from public.property_publication_reviews
      where status = 'approved' and decided_at is not null
        and decided_at >= timezone('utc', now()) - interval '30 days'
    ), 0),
    'rejectionRate7d', coalesce((
      select case when (a + r) > 0 then round((r::numeric / (a + r)::numeric) * 100, 1) else 0 end
      from (
        select
          (select count(*)::int from public.property_publication_reviews
           where status = 'approved' and decided_at >= timezone('utc', now()) - interval '7 days') as a,
          (select count(*)::int from public.property_publication_reviews
           where status = 'rejected' and decided_at >= timezone('utc', now()) - interval '7 days') as r
      ) x
    ), 0),
    'interestsTotal', (select count(*)::int from public.property_interests),
    'contractsStarted', (
      select count(*)::int from public.property_contracts
      where status in ('draft', 'pending_acceptance', 'active') and coalesce(is_demo, false) = false
    ),
    'contractsCompleted', (
      select count(*)::int from public.property_contracts
      where status = 'completed' and coalesce(is_demo, false) = false
    ),
    'interestToContractRate', coalesce((
      select case when i > 0 then round((c::numeric / i::numeric) * 100, 1) else 0 end
      from (
        select
          (select count(*)::int from public.property_interests) as i,
          (select count(*)::int from public.property_contracts
           where status in ('draft', 'pending_acceptance', 'active')
             and coalesce(is_demo, false) = false) as c
      ) y
    ), 0),
    'contentReportsOpen', (
      select count(*)::int from public.content_reports where status in ('open', 'reviewing')
    ),
    'lifecycleDistribution', v_lifecycle,
    'socialLikes', v_likes,
    'socialPosts', v_social,
    'premiumWindowActive', (
      select count(*)::int from public.properties
      where lifecycle_status = 'janela_premium' and deleted_at is null
    )
  );
end;
$$;

-- Who am I for institutional chrome
create or replace function public.get_institutional_identity()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    return jsonb_build_object('authenticated', false);
  end if;
  return jsonb_build_object(
    'authenticated', true,
    'userId', v_actor,
    'isFounder', public.is_founder(v_actor),
    'isOwner', public.is_platform_owner(v_actor),
    'isSystemDemo', coalesce((
      select is_system_demo from public.profiles where id = v_actor
    ), false),
    'roles', coalesce((
      select to_jsonb(array_agg(r.code order by r.code))
      from public.user_roles ur join public.roles r on r.id = ur.role_id
      where ur.user_id = v_actor
    ), '[]'::jsonb),
    'bootstrap', public.founder_bootstrap_status()
  );
end;
$$;

revoke all on function public.get_institutional_identity() from public;
grant execute on function public.get_institutional_identity() to authenticated;
