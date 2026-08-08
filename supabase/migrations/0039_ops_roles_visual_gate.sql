-- 0039_ops_roles_visual_gate.sql
-- Sprint Beta 1.6 — poder operacional real (Supervisor/Admin) + atribuição de fila.
-- Aditivo: permissões do Supervisor, assigned_to, restrição approve/reject, fila enriquecida.

-- ═══════════════════════════════════════════════════════════════════════════
-- 0. Supervisor operational permissions
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.code = 'supervisor'
  and p.code in (
    'properties.review',
    'admin.panel',
    'audit.read',
    'moderation.manage',
    'housing.explore'
  )
on conflict do nothing;

update public.roles
set
  description = 'Supervisão operacional — análise, pendências, contacto PP, SLA e moderação (sem aprovar/rejeitar)',
  updated_at = timezone('utc', now())
where code = 'supervisor';

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Assignment on publication reviews
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.property_publication_reviews
  add column if not exists assigned_to uuid references auth.users (id),
  add column if not exists assigned_at timestamptz;

create index if not exists property_publication_reviews_assigned_idx
  on public.property_publication_reviews (assigned_to, status)
  where assigned_to is not null;

create or replace function public.admin_assign_publication_review(
  p_review_id uuid,
  p_assignee_id uuid default null
)
returns public.property_publication_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_assignee uuid;
  v_row public.property_publication_reviews;
  v_before jsonb;
begin
  if v_actor is null
     or not public.user_has_founder_or_permission(v_actor, 'properties.review') then
    raise exception 'properties.review required';
  end if;

  v_assignee := coalesce(p_assignee_id, v_actor);

  select to_jsonb(r) into v_before
  from public.property_publication_reviews r
  where r.id = p_review_id;
  if v_before is null then
    raise exception 'review not found';
  end if;

  update public.property_publication_reviews
  set
    assigned_to = v_assignee,
    assigned_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where id = p_review_id
  returning * into v_row;

  perform public.write_audit_event(
    'publication.assign',
    'property_publication_review',
    p_review_id::text,
    jsonb_build_object('assignee', v_assignee),
    'Atribuição de processo na Central de Trabalho',
    v_before,
    to_jsonb(v_row),
    null,
    null
  );

  return v_row;
end;
$$;

revoke all on function public.admin_assign_publication_review(uuid, uuid) from public;
grant execute on function public.admin_assign_publication_review(uuid, uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Decide: Supervisors cannot approve/reject; reasons for reject/pending
-- ═══════════════════════════════════════════════════════════════════════════

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
  v_before jsonb;
  v_solutions text := '';
  v_label text;
  v_sol text;
  v_code text;
  v_notify_title text;
  v_notify_body text;
  v_lifecycle text;
  v_review_status text;
  v_now timestamptz := timezone('utc', now());
  v_is_adminish boolean;
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

  v_is_adminish :=
    public.is_founder(v_actor)
    or public.is_platform_owner(v_actor)
    or exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = v_actor
        and r.code in ('administrator', 'super_administrator', 'co_founder')
    );

  if p_decision in ('approve', 'reject') and not v_is_adminish then
    raise exception 'administrator required for approve/reject';
  end if;

  select owner_id, title into v_owner, v_title
  from public.properties where id = p_property_id and deleted_at is null;
  if v_owner is null then
    raise exception 'property not found';
  end if;

  if p_decision in (
       'pending', 'reject', 'request_corrections',
       'request_documents', 'request_technical_visit'
     )
     and coalesce(array_length(p_pending_reason_codes, 1), 0) = 0
     and (p_admin_notes is null or char_length(trim(p_admin_notes)) < 3) then
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
      v_notify_body := 'A publicação foi colocada em pendência.' || coalesce(v_solutions, '') ||
        case when p_admin_notes is not null then E'\n' || p_admin_notes else '' end ||
        E'\nAbra o património e corrija o que foi indicado.';
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
      v_notify_body := 'Solicitamos correcções na ficha.' || coalesce(v_solutions, '') ||
        case when p_admin_notes is not null then E'\n' || p_admin_notes else '' end ||
        E'\nToque para corrigir o património.';
    when 'request_technical_visit' then
      v_review_status := 'technical_visit_requested';
      v_lifecycle := 'em_inspecao_tecnica';
      v_notify_title := 'Visita técnica solicitada';
      v_notify_body := 'Será necessária uma visita técnica de um Agente Kuteka.' || coalesce(v_solutions, '');
    when 'request_documents' then
      v_review_status := 'documents_requested';
      v_lifecycle := 'em_analise_documental';
      v_notify_title := 'Documentação adicional';
      v_notify_body := 'Envie a documentação adicional indicada.' || coalesce(v_solutions, '') ||
        case when p_admin_notes is not null then E'\n' || p_admin_notes else '' end;
  end case;

  select to_jsonb(r) into v_before
  from public.property_publication_reviews r
  where r.property_id = p_property_id
  order by r.created_at desc
  limit 1;

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
      property_id, status, pending_reason_codes, admin_notes, decided_by, decided_at, assigned_to, assigned_at
    ) values (
      p_property_id, v_review_status, coalesce(p_pending_reason_codes, '{}'),
      p_admin_notes, v_actor, v_now, v_actor, v_now
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
      'reasons', coalesce(p_pending_reason_codes, '{}'),
      'fixCta', true
    )
  );

  perform public.write_audit_event(
    'property_publication_' || p_decision,
    'property',
    p_property_id::text,
    jsonb_build_object(
      'reviewId', v_row.id,
      'reasons', coalesce(p_pending_reason_codes, '{}'),
      'notes', p_admin_notes,
      'nextStep', v_lifecycle
    ),
    coalesce(nullif(trim(p_admin_notes), ''), 'Decisão de publicação'),
    v_before,
    to_jsonb(v_row),
    null,
    null
  );

  return v_row;
end;
$$;

revoke all on function public.admin_decide_property_publication(uuid, text, text[], text) from public;
grant execute on function public.admin_decide_property_publication(uuid, text, text[], text) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Enriched work queue
-- ═══════════════════════════════════════════════════════════════════════════

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
        r.assigned_to,
        ap.display_name as assigned_name,
        p.code as property_code,
        p.title,
        p.province,
        p.city,
        p.cover_image_url,
        p.owner_id,
        op.display_name as owner_name,
        ou.email as owner_email,
        p.lifecycle_status,
        p.status as marketplace_status
      from public.property_publication_reviews r
      join public.properties p on p.id = r.property_id and p.deleted_at is null
      left join public.profiles op on op.id = p.owner_id
      left join auth.users ou on ou.id = p.owner_id
      left join public.profiles ap on ap.id = r.assigned_to
      where r.status in (
        'in_review', 'pending', 'corrections_requested',
        'technical_visit_requested', 'documents_requested'
      )
      order by r.created_at asc
      limit greatest(1, least(coalesce(p_limit, 50), 200))
    ) t
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_list_publication_queue(int) from public;
grant execute on function public.admin_list_publication_queue(int) to authenticated;
