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
