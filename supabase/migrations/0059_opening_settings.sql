-- Abertura regulável pelo Founder, contabilista e administradores.
-- Não cria cobrança nova. Só permite ligar ou desligar o que já existe.

insert into public.platform_feature_flags (code, label, description, enabled) values
  ('payments_open', 'Cobrança', 'Abre o pagamento que já existe. Fechado, ninguém cobra.', false),
  ('visits_open', 'Pedidos de visita', 'O cliente pode indicar o dia da visita.', true),
  ('reviews_open', 'Avaliações', 'Quem teve contrato concluído pode avaliar.', true),
  ('providers_open', 'Registo de prestadores', 'Uma empresa pode pedir para entrar. A aprovação continua.', true),
  ('publications_open', 'Registo de imóveis', 'O parceiro pode registar imóvel, mesmo ainda indisponível.', true)
on conflict (code) do nothing;

create or replace function public.can_regulate_opening(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_user_id is not null and (
    public.user_has_permission(p_user_id, 'finance.manage')
    or public.user_has_permission(p_user_id, 'founder.manage')
    or public.user_has_permission(p_user_id, 'admin.panel')
    or exists (
      select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = p_user_id
        and r.code in ('founder', 'co_founder', 'super_administrator', 'administrator', 'accountant')
    )
  );
$$;

revoke all on function public.can_regulate_opening(uuid) from public;
grant execute on function public.can_regulate_opening(uuid) to authenticated;

drop policy if exists platform_feature_flags_write on public.platform_feature_flags;
create policy platform_feature_flags_write
  on public.platform_feature_flags for all to authenticated
  using (public.can_regulate_opening(auth.uid()))
  with check (public.can_regulate_opening(auth.uid()));

create or replace function public.set_feature_flag(p_code text, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not public.can_regulate_opening(v_actor) then
    raise exception 'opening regulation required';
  end if;
  insert into public.platform_feature_flags (code, label, description, enabled, updated_by)
  values (p_code, p_code, '', p_enabled, v_actor)
  on conflict (code) do update
    set enabled = excluded.enabled,
        updated_at = timezone('utc', now()),
        updated_by = v_actor;
  perform public.write_audit_log(
    'feature_flag.updated',
    'platform_feature_flag',
    p_code,
    jsonb_build_object('enabled', p_enabled)
  );
end;
$$;
