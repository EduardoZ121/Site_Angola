'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { formatAoa } from '@/lib/format/aoa';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { LOCALE_INTL_TAG } from '@/modules/i18n/types';
import { getListingsCopy } from '../content';
import { KutekaScoreGauge } from './KutekaScoreGauge';

type EvaluationRow = {
  id: string;
  status: string;
  kuteka_index: number | null;
  suggested_price_aoa: number | null;
  score_structure: number | null;
  score_location: number | null;
  score_documentation: number | null;
  score_finishes: number | null;
  score_profitability: number | null;
  score_security: number | null;
  valuation_plan: string | null;
  counter_proposal_notes: string | null;
  report_notes: string | null;
  recommendations: string | null;
  risk_level: string | null;
  checklist: Record<string, unknown> | null;
  inspection_photos: unknown;
  created_at: string;
};

function computeIndex(row: EvaluationRow): number | null {
  if (row.kuteka_index != null) return Number(row.kuteka_index);
  const parts = [
    row.score_structure,
    row.score_location,
    row.score_documentation,
    row.score_finishes,
    row.score_profitability,
    row.score_security,
  ].filter((n): n is number => n != null);
  if (!parts.length) return null;
  // scores are 0–10 → index 0–100
  return Math.round((parts.reduce((a, b) => a + Number(b), 0) / parts.length) * 10);
}

/**
 * Avaliação técnica Cap.6 — checklist, pontuação, relatório e Índice Kuteka.
 */
export function PropertyEvaluationPanel({ propertyId }: { propertyId: string }) {
  const { locale } = useLocale();
  const copy = getListingsCopy(locale).evaluation;
  const [row, setRow] = useState<EvaluationRow | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = createBrowserClient();
        const full = await client
          .from('property_evaluations')
          .select(
            'id, status, kuteka_index, suggested_price_aoa, score_structure, score_location, score_documentation, score_finishes, score_profitability, score_security, valuation_plan, counter_proposal_notes, report_notes, recommendations, risk_level, checklist, inspection_photos, created_at',
          )
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!cancelled) {
          if (!full.error && full.data) {
            setRow(full.data as EvaluationRow);
          } else {
            const legacy = await client
              .from('property_evaluations')
              .select(
                'id, status, kuteka_index, suggested_price_aoa, score_structure, score_location, score_documentation, score_finishes, score_profitability, score_security, valuation_plan, counter_proposal_notes, report_notes, checklist, created_at',
              )
              .eq('property_id', propertyId)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            setRow(legacy.data ? ({ ...(legacy.data as EvaluationRow) } as EvaluationRow) : null);
          }
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setRow(null);
          setLoaded(true);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const index = useMemo(() => (row ? computeIndex(row) : null), [row]);

  if (!loaded) {
    return (
      <section className="kuteka-detail-panel p-5 sm:p-6">
        <p className="kuteka-detail-meta">{copy.loading}</p>
      </section>
    );
  }

  if (!row) {
    return (
      <section
        id="avaliacao"
        className="kuteka-detail-panel p-5 sm:p-6"
        aria-labelledby="eval-heading"
      >
        <h2 id="eval-heading" className="kuteka-detail-title">
          {copy.title}
        </h2>
        <p className="kuteka-detail-body mt-2">{copy.empty}</p>
      </section>
    );
  }

  const statusLabels = copy.status as Record<string, string>;
  const riskLabels = copy.risk as Record<string, string>;
  const scores = [
    { label: copy.dims.structure, value: row.score_structure },
    { label: copy.dims.location, value: row.score_location },
    { label: copy.dims.documentation, value: row.score_documentation },
    { label: copy.dims.finishes, value: row.score_finishes },
    { label: copy.dims.profitability, value: row.score_profitability },
    { label: copy.dims.security, value: row.score_security },
  ];

  const checklistEntries = row.checklist ? Object.entries(row.checklist) : [];
  const photos = Array.isArray(row.inspection_photos)
    ? row.inspection_photos.filter((p): p is string => typeof p === 'string')
    : [];

  return (
    <section
      id="avaliacao"
      className="kuteka-detail-panel p-5 sm:p-6"
      aria-labelledby="eval-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--kuteka-detail-line)] pb-4">
        <div>
          <p className="kuteka-detail-eyebrow">{copy.eyebrow}</p>
          <h2 id="eval-heading" className="kuteka-detail-title mt-1">
            {copy.titleFull}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="kuteka-detail-chip kuteka-detail-chip--accent">
            {statusLabels[row.status] ?? row.status}
          </span>
          {row.risk_level ? (
            <span className="kuteka-detail-chip">
              {riskLabels[row.risk_level] ?? row.risk_level}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => window.print()}
            className="kuteka-detail-chip kuteka-detail-chip--accent"
          >
            {copy.printReport}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
        <KutekaScoreGauge score={index} size="md" label={copy.calculatedIndex} />
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="kuteka-detail-fact">
            <dt className="kuteka-detail-label">{copy.suggestedPrice}</dt>
            <dd className="kuteka-detail-value">{formatAoa(row.suggested_price_aoa, 'sale')}</dd>
          </div>
          <div className="kuteka-detail-fact">
            <dt className="kuteka-detail-label">{copy.reportDate}</dt>
            <dd className="kuteka-detail-value">
              {new Date(row.created_at).toLocaleDateString(LOCALE_INTL_TAG[locale])}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-5">
        <h3 className="kuteka-detail-subtitle">{copy.dimsTitle}</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {scores.map((s) => (
            <li
              key={s.label}
              className="kuteka-detail-review flex items-center justify-between gap-2"
            >
              <span className="kuteka-detail-body">{s.label}</span>
              <span className="font-mono font-semibold text-[#08263f]">
                {s.value != null ? `${Number(s.value).toFixed(1)}/10` : '—'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {checklistEntries.length ? (
        <div className="mt-5">
          <h3 className="kuteka-detail-subtitle">{copy.checklistTitle}</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {checklistEntries.map(([key, val]) => (
              <li key={key} className="kuteka-detail-chip capitalize">
                {key.replace(/_/g, ' ')}: <strong>{String(val)}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {photos.length ? (
        <div className="mt-5">
          <h3 className="kuteka-detail-subtitle">{copy.inspectionPhotos}</h3>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {photos.map((url) => (
              <li key={url} className="overflow-hidden rounded-kuteka border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="aspect-square w-full object-cover" />
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="kuteka-detail-meta mt-5">{copy.photosPending}</p>
      )}

      {row.report_notes ? (
        <div className="mt-5">
          <h3 className="kuteka-detail-subtitle">{copy.reportNotes}</h3>
          <p className="kuteka-detail-body mt-2 whitespace-pre-wrap">{row.report_notes}</p>
        </div>
      ) : null}

      {row.recommendations || row.valuation_plan ? (
        <div className="mt-5">
          <h3 className="kuteka-detail-subtitle">{copy.recommendations}</h3>
          <p className="kuteka-detail-body mt-2 whitespace-pre-wrap">
            {row.recommendations || row.valuation_plan}
          </p>
        </div>
      ) : null}

      {row.counter_proposal_notes ? (
        <div className="mt-5">
          <h3 className="kuteka-detail-subtitle">{copy.counterProposal}</h3>
          <p className="kuteka-detail-body mt-2 whitespace-pre-wrap">
            {row.counter_proposal_notes}
          </p>
        </div>
      ) : null}
    </section>
  );
}
