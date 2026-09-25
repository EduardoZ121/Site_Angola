-- Publicações Demo visíveis no mercado, marcadas como demonstração.
-- Um administrador retira-as uma a uma. Não passam a oferta real.

create or replace function public.property_is_publicly_visible(p public.properties)
returns boolean
language sql
stable
as $$
  select
    p.deleted_at is null
    and p.status = 'active'
    and coalesce(p.review_status, 'approved') = 'approved'
    and (
      p.is_demo = true
      or p.premium_visible_at is null
      or p.premium_visible_at <= timezone('utc', now())
    )
    and (
      p.is_demo = true
      or coalesce(p.lifecycle_status, 'publicado') in (
        'publicado',
        'janela_premium',
        'em_negociacao',
        'disponivel_novamente',
        'libertacao_prevista',
        'temporariamente_indisponivel',
        'em_manutencao'
      )
      or (
        p.expected_available_on is not null
        and p.expected_available_on >= current_date
      )
    );
$$;

create or replace function public.retire_demo_publication(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_code text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if not (
    public.user_has_permission(v_actor, 'admin.panel')
    or public.is_founder(v_actor)
  ) then
    raise exception 'admin required to retire demo publication';
  end if;

  update public.properties
  set deleted_at = timezone('utc', now()),
      status = 'archived'
  where id = p_id
    and coalesce(is_demo, false) = true
    and deleted_at is null
  returning code into v_code;

  if v_code is null then
    raise exception 'demo publication not found';
  end if;

  perform public.write_audit_event(
    'property.demo_retired',
    'property',
    p_id::text,
    jsonb_build_object('code', v_code)
  );

  return jsonb_build_object('ok', true, 'code', v_code);
end;
$$;

revoke all on function public.retire_demo_publication(uuid) from public;
grant execute on function public.retire_demo_publication(uuid) to authenticated;
