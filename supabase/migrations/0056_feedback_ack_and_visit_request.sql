-- Aviso ao autor quando o relato fecha (BETA-23) e pedido de visita no interesse já existente.
-- Não cria calendário novo nem segundo sistema de tickets.

alter table public.property_interests
  add column if not exists visit_on date,
  add column if not exists visit_window text;

alter table public.property_interests
  drop constraint if exists property_interests_visit_window_check;

alter table public.property_interests
  add constraint property_interests_visit_window_check
  check (visit_window is null or visit_window in ('manha', 'tarde', 'qualquer'));

create or replace function public.request_property_visit(
  p_property_id uuid,
  p_visit_on date,
  p_window text default 'qualquer'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_id uuid;
  v_window text := coalesce(nullif(trim(p_window), ''), 'qualquer');
  v_note text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if p_visit_on is null then
    raise exception 'visit date required';
  end if;
  if v_window not in ('manha', 'tarde', 'qualquer') then
    raise exception 'invalid visit window';
  end if;

  v_note := 'Pedido de visita: ' || p_visit_on::text || ' · ' ||
    case v_window
      when 'manha' then 'manhã'
      when 'tarde' then 'tarde'
      else 'qualquer hora'
    end;

  v_id := public.express_property_interest(p_property_id, v_note);

  update public.property_interests
  set visit_on = p_visit_on,
      visit_window = v_window,
      notes = v_note
  where id = v_id;

  return v_id;
end;
$$;

revoke all on function public.request_property_visit(uuid, date, text) from public;
grant execute on function public.request_property_visit(uuid, date, text) to authenticated;

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
  v_title text;
  v_body text;
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

  if v_row.actor_id is not null
     and v_before.status is distinct from v_row.status
     and v_row.status in ('resolvido', 'duplicado', 'nao_reproduzivel') then
    v_title := case v_row.status
      when 'resolvido' then 'O seu relato foi tratado'
      when 'duplicado' then 'O seu relato já estava registado'
      else 'Não foi possível reproduzir o relato'
    end;
    v_body := coalesce(
      nullif(trim(coalesce(v_row.resolution_notes, '')), ''),
      'A operação fechou o relato. Não há resposta automática além deste aviso.'
    );
    perform public.notify_user(
      v_row.actor_id,
      'beta_feedback',
      v_title,
      v_body,
      '/app/ajuda',
      jsonb_build_object('feedback_id', v_row.id, 'status', v_row.status)
    );
  end if;

  return v_row;
end;
$$;

revoke all on function public.kocc_update_beta_feedback_status(uuid, text, text) from public;
grant execute on function public.kocc_update_beta_feedback_status(uuid, text, text) to authenticated;
