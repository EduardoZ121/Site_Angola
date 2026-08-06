'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { formatAoa } from '@/lib/format/aoa';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { LOCALE_INTL_TAG, type AppLocale } from '@/modules/i18n/types';
import { getListingsCopy } from '../content';
import { asHistoryList, getConservationLabels, getLifecycleLabels } from '../lib/manual-ops-labels';
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

function formatDate(iso: string | null | undefined, locale: AppLocale): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(LOCALE_INTL_TAG[locale]);
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
  const { locale } = useLocale();
  const copy = getListingsCopy(locale).health;
  const conservationLabels = getConservationLabels(locale);
  const lifecycleLabels = getLifecycleLabels(locale);
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
      ? { label: copy.riskUnrated, tone: 'kuteka-detail-chip' }
      : score >= 80
        ? { label: copy.riskLow, tone: 'kuteka-detail-chip kuteka-detail-chip--accent' }
        : score >= 60
          ? { label: copy.riskModerate, tone: 'kuteka-detail-chip' }
          : { label: copy.riskHigh, tone: 'kuteka-detail-chip' };

  const tip =
    row.needs_renovation || (score != null && score < 75)
      ? copy.tipRenovation
      : score != null && score >= 85
        ? copy.tipExcellent
        : copy.tipDefault;

  const valueSeries = valuations
    .filter((v) => typeof (v as { price_aoa?: number }).price_aoa === 'number' || v.score != null)
    .slice(-4);

  return (
    <section id="saude" className="kuteka-detail-panel p-5 sm:p-6" aria-labelledby="health-heading">
      <div className="border-b border-[var(--kuteka-detail-line)] pb-4">
        <p className="kuteka-detail-eyebrow">{copy.eyebrow}</p>
        <h2 id="health-heading" className="kuteka-detail-title mt-1">
          {copy.title}
        </h2>
        <p className="kuteka-detail-meta mt-1">{copy.subtitle}</p>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
        <KutekaScoreGauge score={score} size="lg" />
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <span className={risk.tone}>{risk.label}</span>
            {row.needs_renovation ? (
              <span className="kuteka-detail-chip kuteka-detail-chip--accent">
                {copy.renovationAlert}
              </span>
            ) : (
              <span className="kuteka-detail-chip">{copy.noUrgentRenovation}</span>
            )}
            {nextMaint && nextMaint.getTime() < Date.now() + 30 * 86400000 ? (
              <span className="kuteka-detail-chip kuteka-detail-chip--accent">
                {copy.upcomingMaintenance}
              </span>
            ) : null}
          </div>

          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Metric
              label={copy.overallState}
              value={
                lifecycleLabels[row.lifecycle_status ?? ''] ??
                row.lifecycle_status ??
                copy.preparing
              }
            />
            <Metric
              label={copy.conservation}
              value={
                conservationLabels[row.conservation_state ?? ''] ?? row.conservation_state ?? '—'
              }
            />
            <Metric label={copy.estimatedValue} value={formatAoa(row.price_aoa, row.purpose)} />
            <Metric
              label={copy.lastMaintenance}
              value={formatDate(row.last_maintenance_at, locale)}
            />
            <Metric
              label={copy.lastInspection}
              value={formatDate(row.last_inspection_at, locale)}
            />
            <Metric
              label={copy.nextMaintenance}
              value={nextMaint ? formatDate(nextMaint.toISOString(), locale) : copy.toDefine}
            />
            <Metric
              label={copy.nextInspection}
              value={nextInsp ? formatDate(nextInsp.toISOString(), locale) : copy.toDefine}
            />
            {metrics ? (
              <>
                <Metric label={copy.views30d} value={String(metrics.views_30d)} />
                <Metric label={copy.visits30d} value={String(metrics.visits_30d)} />
                <Metric label={copy.proposals30d} value={String(metrics.proposals_30d)} />
                {metrics.estimated_yield_pct != null ? (
                  <Metric
                    label={copy.estimatedYield}
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
          <h3 className="kuteka-detail-subtitle">{copy.valueEvolution}</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {valueSeries.map((v, idx) => {
              const price = (v as { price_aoa?: number }).price_aoa;
              return (
                <li key={idx} className="kuteka-detail-review min-w-[8rem] flex-1">
                  <p className="kuteka-detail-meta">{v.at ?? '—'}</p>
                  <p className="kuteka-detail-value mt-1">
                    {v.score != null ? copy.indexLabel.replace('{score}', String(v.score)) : '—'}
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
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-900">
          {copy.tipLabel}
        </p>
        <p className="mt-1 text-sm font-medium text-emerald-950">{tip}</p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <HistoryBlock
          title={copy.technicalHistory}
          items={maintenance}
          noRecords={copy.noRecords}
        />
        <HistoryBlock title={copy.inspections} items={inspections} noRecords={copy.noRecords} />
        <HistoryBlock
          title={copy.valuations}
          items={valuations.map((v) => ({
            at: v.at,
            note:
              v.score != null
                ? `${copy.indexLabel.replace('{score}', String(v.score))}${v.note ? ` · ${v.note}` : ''}`
                : v.note,
          }))}
          noRecords={copy.noRecords}
        />
      </div>
    </section>
  );
}

function HistoryBlock({
  title,
  items,
  noRecords,
}: {
  title: string;
  items: Array<{ at?: string; note?: string }>;
  noRecords: string;
}) {
  return (
    <div>
      <h3 className="kuteka-detail-subtitle">{title}</h3>
      {items.length === 0 ? (
        <p className="kuteka-detail-meta mt-2">{noRecords}</p>
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
