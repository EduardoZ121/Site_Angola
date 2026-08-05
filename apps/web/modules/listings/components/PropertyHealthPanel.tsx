'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { formatAoa } from '@/lib/format/aoa';
import { CONSERVATION_LABELS, LIFECYCLE_LABELS, asHistoryList } from '../lib/manual-ops-labels';
import type { EnrichedListing } from '../types';
import { KutekaScoreGauge } from './KutekaScoreGauge';

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="kuteka-detail-fact">
      <dt className="kuteka-detail-label">{label}</dt>
      <dd className="kuteka-detail-value">{value}</dd>
      {hint ? <p className="mt-1 text-xs text-stone-700">{hint}</p> : null}
    </div>
  );
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-AO');
  } catch {
    return iso;
  }
}

type Metrics = {
  views_30d: number;
  visits_30d: number;
  proposals_30d: number;
  estimated_yield_pct: number | null;
};

/**
 * Cockpit de Saúde do Património — Manual Cap.10.10.
 */
export function PropertyHealthPanel({ row }: { row: EnrichedListing }) {
  const score = row.kuteka_score != null ? Number(row.kuteka_score) : null;
  const maintenance = asHistoryList(row.maintenance_history);
  const inspections = asHistoryList(row.inspection_history);
  const valuations = asHistoryList(row.valuation_history);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = createBrowserClient();
        const { data } = await client
          .from('property_metrics')
          .select('views_30d, visits_30d, proposals_30d, estimated_yield_pct')
          .eq('property_id', row.id)
          .maybeSingle();
        if (!cancelled) setMetrics((data as Metrics) ?? null);
      } catch {
        if (!cancelled) setMetrics(null);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [row.id]);

  const nextMaint = row.last_maintenance_at
    ? new Date(new Date(row.last_maintenance_at).getTime() + 90 * 86400000)
    : null;
  const nextInsp = row.last_inspection_at
    ? new Date(new Date(row.last_inspection_at).getTime() + 180 * 86400000)
    : null;

  const risk =
    score == null
      ? { label: 'Por avaliar', tone: 'kuteka-detail-chip' }
      : score >= 80
        ? { label: 'Risco baixo', tone: 'kuteka-detail-chip kuteka-detail-chip--accent' }
        : score >= 60
          ? { label: 'Risco moderado', tone: 'kuteka-detail-chip' }
          : { label: 'Risco elevado', tone: 'kuteka-detail-chip' };

  const tip =
    row.needs_renovation || (score != null && score < 75)
      ? 'Pequenas melhorias na fachada e fotografia profissional podem aumentar o valor de mercado até cerca de 8%.'
      : score != null && score >= 85
        ? 'Património em excelente condição — mantenha inspeções semestrais e actualize o PDK após qualquer obra.'
        : 'Agende a próxima manutenção preventiva e confirme a documentação no Passaporte Digital.';

  const valueSeries = valuations
    .filter((v) => typeof (v as { price_aoa?: number }).price_aoa === 'number' || v.score != null)
    .slice(-4);

  return (
    <section id="saude" className="kuteka-detail-panel p-5 sm:p-6" aria-labelledby="health-heading">
      <div className="border-b border-[var(--kuteka-detail-line)] pb-4">
        <p className="kuteka-detail-eyebrow">Cockpit patrimonial</p>
        <h2 id="health-heading" className="kuteka-detail-title mt-1">
          Painel de Saúde do Património
        </h2>
        <p className="kuteka-detail-meta mt-1">
          Acompanhe o Índice Kuteka, alertas, evolução e recomendações automáticas.
        </p>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
        <KutekaScoreGauge score={score} size="lg" />
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <span className={risk.tone}>{risk.label}</span>
            {row.needs_renovation ? (
              <span className="kuteka-detail-chip kuteka-detail-chip--accent">
                Alerta: remodelação recomendada
              </span>
            ) : (
              <span className="kuteka-detail-chip">Sem remodelação urgente</span>
            )}
            {nextMaint && nextMaint.getTime() < Date.now() + 30 * 86400000 ? (
              <span className="kuteka-detail-chip kuteka-detail-chip--accent">
                Manutenção prevista em breve
              </span>
            ) : null}
          </div>

          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Metric
              label="Estado geral"
              value={
                LIFECYCLE_LABELS[row.lifecycle_status ?? ''] ??
                row.lifecycle_status ??
                'Em preparação'
              }
            />
            <Metric
              label="Conservação"
              value={
                CONSERVATION_LABELS[row.conservation_state ?? ''] ?? row.conservation_state ?? '—'
              }
            />
            <Metric label="Valor estimado" value={formatAoa(row.price_aoa, row.purpose)} />
            <Metric label="Última manutenção" value={formatDate(row.last_maintenance_at)} />
            <Metric label="Última inspeção" value={formatDate(row.last_inspection_at)} />
            <Metric
              label="Próxima manutenção"
              value={nextMaint ? formatDate(nextMaint.toISOString()) : 'A definir'}
            />
            <Metric
              label="Próxima inspeção"
              value={nextInsp ? formatDate(nextInsp.toISOString()) : 'A definir'}
            />
            {metrics ? (
              <>
                <Metric label="Visualizações (30d)" value={String(metrics.views_30d)} />
                <Metric label="Visitas (30d)" value={String(metrics.visits_30d)} />
                <Metric label="Propostas (30d)" value={String(metrics.proposals_30d)} />
                {metrics.estimated_yield_pct != null ? (
                  <Metric
                    label="Rentabilidade estimada"
                    value={`${Number(metrics.estimated_yield_pct).toFixed(1)}%`}
                  />
                ) : null}
              </>
            ) : null}
          </dl>
        </div>
      </div>

      {valueSeries.length > 0 ? (
        <div className="mt-6">
          <h3 className="kuteka-detail-subtitle">Evolução do imóvel / valor</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {valueSeries.map((v, idx) => {
              const price = (v as { price_aoa?: number }).price_aoa;
              return (
                <li key={idx} className="kuteka-detail-review min-w-[8rem] flex-1">
                  <p className="kuteka-detail-meta">{v.at ?? '—'}</p>
                  <p className="kuteka-detail-value mt-1">
                    {v.score != null ? `Índice ${v.score}` : '—'}
                  </p>
                  {price != null ? (
                    <p className="kuteka-detail-body mt-1">{formatAoa(price, row.purpose)}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 rounded-kuteka border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-900">Dica Kuteka</p>
        <p className="mt-1 text-sm font-medium text-emerald-950">{tip}</p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <HistoryBlock title="Histórico técnico" items={maintenance} />
        <HistoryBlock title="Inspeções" items={inspections} />
        <HistoryBlock
          title="Valorizações"
          items={valuations.map((v) => ({
            at: v.at,
            note: v.score != null ? `Índice ${v.score}${v.note ? ` · ${v.note}` : ''}` : v.note,
          }))}
        />
      </div>
    </section>
  );
}

function HistoryBlock({
  title,
  items,
}: {
  title: string;
  items: Array<{ at?: string; note?: string }>;
}) {
  return (
    <div>
      <h3 className="kuteka-detail-subtitle">{title}</h3>
      {items.length === 0 ? (
        <p className="kuteka-detail-meta mt-2">Sem registos ainda.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {items.slice(0, 5).map((item, idx) => (
            <li key={`${item.at ?? 'x'}-${idx}`} className="kuteka-detail-review">
              <p className="kuteka-detail-meta">{item.at ?? '—'}</p>
              <p className="kuteka-detail-body mt-1">{item.note ?? '—'}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
