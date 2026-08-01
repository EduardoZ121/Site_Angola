-- Premium polish: contract Cap.7 fields, review replies, evaluation photos, richer PDK seed

-- ─── Partner service contracts (Manual Cap.7 — contrato real) ───────────────
alter table public.partner_service_contracts
  add column if not exists version text not null default '1.0',
  add column if not exists valid_from date,
  add column if not exists valid_until date,
  add column if not exists signed_at timestamptz,
  add column if not exists signature_name text,
  add column if not exists document_url text,
  add column if not exists renewal_of uuid references public.partner_service_contracts (id),
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_reason text;

-- ─── Reviews — respostas (Airbnb-style) ─────────────────────────────────────
alter table public.contract_reviews
  add column if not exists owner_reply text,
  add column if not exists owner_replied_at timestamptz,
  add column if not exists agent_reply text,
  add column if not exists agent_replied_at timestamptz;

drop policy if exists contract_reviews_update_reply on public.contract_reviews;
create policy contract_reviews_update_reply
  on public.contract_reviews for update to authenticated
  using (
    public.user_has_permission(auth.uid(), 'admin.panel')
    or public.user_has_permission(auth.uid(), 'executive.panel')
    or exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
    or public.user_has_permission(auth.uid(), 'agent.operate')
  )
  with check (
    public.user_has_permission(auth.uid(), 'admin.panel')
    or public.user_has_permission(auth.uid(), 'executive.panel')
    or exists (
      select 1 from public.properties p
      where p.id = property_id and p.owner_id = auth.uid()
    )
    or public.user_has_permission(auth.uid(), 'agent.operate')
  );

-- ─── Evaluations — fotos + recomendações ─────────────────────────────────────
alter table public.property_evaluations
  add column if not exists inspection_photos jsonb not null default '[]'::jsonb,
  add column if not exists recommendations text,
  add column if not exists risk_level text
    check (risk_level is null or risk_level in ('low','medium','high'));

-- ─── Property metrics (dashboard real) ──────────────────────────────────────
create table if not exists public.property_metrics (
  property_id uuid primary key references public.properties (id) on delete cascade,
  views_30d integer not null default 0,
  visits_30d integer not null default 0,
  proposals_30d integer not null default 0,
  avg_days_to_rent integer,
  avg_days_to_sale integer,
  estimated_yield_pct numeric(6,2),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.property_metrics enable row level security;

drop policy if exists property_metrics_select on public.property_metrics;
create policy property_metrics_select
  on public.property_metrics for select to authenticated
  using (
    exists (
      select 1 from public.properties p
      where p.id = property_id and p.deleted_at is null
        and (
          p.owner_id = auth.uid()
          or public.user_has_permission(auth.uid(), 'admin.panel')
          or public.user_has_permission(auth.uid(), 'executive.panel')
          or public.user_has_permission(auth.uid(), 'agent.operate')
          or (p.status = 'active' and public.user_has_permission(auth.uid(), 'housing.explore'))
        )
    )
  );

-- ─── Seed polish for demo property + contracts ──────────────────────────────
create or replace function public.seed_premium_ops_polish()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prop uuid;
  v_partner uuid := 'a0000000-0000-4000-8000-0000000000d1';
  v_agent uuid := 'a0000000-0000-4000-8000-0000000000d2';
  r record;
begin
  select id into v_prop from public.properties where code = 'KTK-DEMO-0001' and deleted_at is null limit 1;

  if v_prop is not null then
    update public.properties
    set
      owner_history = case
        when jsonb_array_length(coalesce(owner_history, '[]'::jsonb)) > 0 then owner_history
        else '[
          {"at":"2022-03-01","note":"Registo inicial — Parceiro demo Kuteka"},
          {"at":"2024-08-15","note":"Titularidade confirmada na plataforma"}
        ]'::jsonb
      end,
      maintenance_history = case
        when jsonb_array_length(coalesce(maintenance_history, '[]'::jsonb)) > 0 then maintenance_history
        else '[
          {"at":"2025-11-12","note":"Revisão eléctrica completa"},
          {"at":"2026-04-01","note":"Pintura exterior e impermeabilização"},
          {"at":"2026-06-01","note":"Manutenção preventiva AVAC"}
        ]'::jsonb
      end,
      inspection_history = case
        when jsonb_array_length(coalesce(inspection_history, '[]'::jsonb)) > 0 then inspection_history
        else '[
          {"at":"2026-05-10","note":"Pré-inspecção documental"},
          {"at":"2026-06-15","note":"Inspeção técnica Agente — habitável"},
          {"at":"2026-07-01","note":"Revisão pós-pintura"}
        ]'::jsonb
      end,
      valuation_history = case
        when jsonb_array_length(coalesce(valuation_history, '[]'::jsonb)) > 0 then valuation_history
        else '[
          {"at":"2025-12-01","score":82,"price_aoa":175000000,"note":"Avaliação preliminar"},
          {"at":"2026-06-20","score":88,"price_aoa":185000000,"note":"Avaliação oficial Cap.6"}
        ]'::jsonb
      end,
      kuteka_score = coalesce(kuteka_score, 88),
      last_maintenance_at = coalesce(last_maintenance_at, timezone('utc', now()) - interval '60 days'),
      last_inspection_at = coalesce(last_inspection_at, timezone('utc', now()) - interval '28 days'),
      commercial_notes = coalesce(commercial_notes,
        'Procura elevada em Talatona. Estratégia: venda/arrendamento premium. 3 propostas nos últimos 30 dias.'),
      legal_notes = coalesce(legal_notes,
        'Documentação validada. Título apresentado. Sem ónus registados na demo.')
    where id = v_prop;

    insert into public.property_metrics (
      property_id, views_30d, visits_30d, proposals_30d,
      avg_days_to_rent, avg_days_to_sale, estimated_yield_pct
    )
    values (v_prop, 186, 12, 3, 28, 65, 7.5)
    on conflict (property_id) do update set
      views_30d = excluded.views_30d,
      visits_30d = excluded.visits_30d,
      proposals_30d = excluded.proposals_30d,
      avg_days_to_rent = excluded.avg_days_to_rent,
      avg_days_to_sale = excluded.avg_days_to_sale,
      estimated_yield_pct = excluded.estimated_yield_pct,
      updated_at = timezone('utc', now());

    update public.partner_service_contracts
    set
      version = coalesce(nullif(version, ''), '1.0'),
      valid_from = coalesce(valid_from, (timezone('utc', now()) - interval '30 days')::date),
      valid_until = coalesce(valid_until, (timezone('utc', now()) + interval '335 days')::date),
      signed_at = coalesce(signed_at, timezone('utc', now()) - interval '28 days'),
      signature_name = coalesce(signature_name, 'Parceiro Demo Kuteka'),
      status = case when status = 'draft' then 'active' else status end,
      terms_notes = coalesce(terms_notes,
        'Contrato de Prestação de Serviços Kuteka ↔ Parceiro Patrimonial. Gestão completa com exclusividade parcial.'),
      commission_notes = coalesce(commission_notes,
        'Comissão conforme tabela Kuteka vigente. Mensalidade de gestão aplicável.')
    where property_id = v_prop;

    update public.property_evaluations
    set
      recommendations = coalesce(recommendations,
        'Manutenção preventiva da fachada; reforço de jardinagem; actualização fotográfica profissional no próximo trimestre.'),
      risk_level = coalesce(risk_level, 'low'),
      inspection_photos = case
        when jsonb_array_length(coalesce(inspection_photos, '[]'::jsonb)) > 0 then inspection_photos
        else '[]'::jsonb
      end,
      status = case when status = 'draft' then 'approved' else status end
    where property_id = v_prop;

    -- Enrich timeline with full lifecycle if sparse
    if (select count(*) from public.property_timeline_events where property_id = v_prop) < 8 then
      insert into public.property_timeline_events
        (property_id, event_type, title, summary, actor_id, is_demo, occurred_at)
      values
        (v_prop, 'registered', 'Imóvel registado', 'Património activado na plataforma Kuteka.', v_partner, true, timezone('utc', now()) - interval '45 days'),
        (v_prop, 'documents', 'Documentação validada', 'Checklist de confiança concluída.', v_partner, true, timezone('utc', now()) - interval '40 days'),
        (v_prop, 'inspection', 'Inspeção técnica', 'Visita técnica do Agente Certificado.', v_agent, true, timezone('utc', now()) - interval '35 days'),
        (v_prop, 'evaluation', 'Avaliação oficial', 'Índice Kuteka e relatório Cap.6 aprovados.', v_agent, true, timezone('utc', now()) - interval '30 days'),
        (v_prop, 'renovation', 'Remodelação', 'Pintura exterior e revisão eléctrica.', v_partner, true, timezone('utc', now()) - interval '25 days'),
        (v_prop, 'service_contract', 'Contrato de serviços Kuteka', 'Contrato Cap.7 assinado (gestão).', v_partner, true, timezone('utc', now()) - interval '28 days'),
        (v_prop, 'published', 'Publicação', 'Anúncio activo no inventário.', v_partner, true, timezone('utc', now()) - interval '21 days');
    end if;

    -- Owner/agent replies on demo reviews
    update public.contract_reviews
    set
      owner_reply = coalesce(owner_reply, 'Obrigado pelo feedback — a Kuteka acompanha a manutenção contínua.'),
      owner_replied_at = coalesce(owner_replied_at, timezone('utc', now()) - interval '20 hours'),
      agent_reply = coalesce(agent_reply, 'Foi um prazer acompanhar a visita e a formalização.'),
      agent_replied_at = coalesce(agent_replied_at, timezone('utc', now()) - interval '18 hours')
    where property_id = v_prop and is_demo = true and subject_kind = 'property';
  end if;

  -- Metrics for other active demos (lighter)
  for r in
    select id from public.properties
    where is_demo = true and deleted_at is null and status = 'active'
    order by code
    limit 20
  loop
    insert into public.property_metrics (property_id, views_30d, visits_30d, proposals_30d, estimated_yield_pct)
    values (
      r.id,
      40 + (abs(hashtext(r.id::text)) % 160),
      2 + (abs(hashtext(r.id::text)) % 10),
      abs(hashtext(r.id::text)) % 5,
      5.5 + (abs(hashtext(r.id::text)) % 40) / 10.0
    )
    on conflict (property_id) do nothing;

    update public.properties
    set
      kuteka_score = coalesce(kuteka_score, 70 + (abs(hashtext(id::text)) % 25)),
      owner_history = case
        when jsonb_array_length(coalesce(owner_history, '[]'::jsonb)) > 0 then owner_history
        else jsonb_build_array(jsonb_build_object('at', to_char(created_at, 'YYYY-MM-DD'), 'note', 'Registo na Kuteka'))
      end,
      maintenance_history = case
        when jsonb_array_length(coalesce(maintenance_history, '[]'::jsonb)) > 0 then maintenance_history
        else jsonb_build_array(jsonb_build_object('at', to_char(created_at + interval '30 days', 'YYYY-MM-DD'), 'note', 'Manutenção preventiva'))
      end,
      inspection_history = case
        when jsonb_array_length(coalesce(inspection_history, '[]'::jsonb)) > 0 then inspection_history
        else jsonb_build_array(jsonb_build_object('at', to_char(created_at + interval '14 days', 'YYYY-MM-DD'), 'note', 'Inspeção técnica inicial'))
      end,
      valuation_history = case
        when jsonb_array_length(coalesce(valuation_history, '[]'::jsonb)) > 0 then valuation_history
        else jsonb_build_array(jsonb_build_object(
          'at', to_char(created_at + interval '20 days', 'YYYY-MM-DD'),
          'score', coalesce(kuteka_score, 80),
          'price_aoa', price_aoa,
          'note', 'Avaliação comercial'
        ))
      end
    where id = r.id;
  end loop;
end;
$$;

revoke all on function public.seed_premium_ops_polish() from public;
grant execute on function public.seed_premium_ops_polish() to authenticated;

select public.seed_premium_ops_polish();
