'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { formatAoa } from '@/lib/format/aoa';

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
  checklist: Record<string, unknown> | null;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Em preparação',
  submitted: 'Submetida',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
};

/**
 * Avaliação técnica obrigatória — Manual Cap.6.
 */
export function PropertyEvaluationPanel({ propertyId }: { propertyId: string }) {
  const [row, setRow] = useState<EvaluationRow | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = createBrowserClient();
        const { data, error } = await client
          .from('property_evaluations')
          .select(
            'id, status, kuteka_index, suggested_price_aoa, score_structure, score_location, score_documentation, score_finishes, score_profitability, score_security, valuation_plan, counter_proposal_notes, report_notes, checklist, created_at',
          )
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!cancelled) {
          if (error) {
            setRow(null);
          } else {
            setRow((data as EvaluationRow) ?? null);
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

  if (!loaded) {
    return (
      <section className="kuteka-detail-panel p-5 sm:p-6">
        <p className="kuteka-detail-meta">A carregar avaliação técnica…</p>
      </section>
    );
  }

  if (!row) {
    return (
      <section className="kuteka-detail-panel p-5 sm:p-6" aria-labelledby="eval-heading">
        <h2 id="eval-heading" className="kuteka-detail-title">
          Avaliação técnica
        </h2>
        <p className="kuteka-detail-body mt-2">
          Ainda não existe relatório de avaliação para este património. Serviços de gestão,
          remodelação ou conclusão de obra exigem avaliação antes da publicação plena.
        </p>
      </section>
    );
  }

  const scores = [
    { label: 'Estrutura', value: row.score_structure },
    { label: 'Localização', value: row.score_location },
    { label: 'Documentação', value: row.score_documentation },
    { label: 'Acabamentos', value: row.score_finishes },
    { label: 'Rentabilidade', value: row.score_profitability },
    { label: 'Segurança', value: row.score_security },
  ];

  const checklistEntries = row.checklist ? Object.entries(row.checklist) : [];

  return (
    <section className="kuteka-detail-panel p-5 sm:p-6" aria-labelledby="eval-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--kuteka-detail-line)] pb-4">
        <div>
          <p className="kuteka-detail-eyebrow">Manual Cap.6</p>
          <h2 id="eval-heading" className="kuteka-detail-title mt-1">
            Avaliação técnica & Índice Kuteka
          </h2>
        </div>
        <span className="kuteka-detail-chip kuteka-detail-chip--accent">
          {STATUS_LABELS[row.status] ?? row.status}
        </span>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="kuteka-detail-fact">
          <dt className="kuteka-detail-label">Índice Kuteka</dt>
          <dd className="kuteka-detail-value">
            {row.kuteka_index != null ? Number(row.kuteka_index).toFixed(0) : '—'}
          </dd>
        </div>
        <div className="kuteka-detail-fact">
          <dt className="kuteka-detail-label">Preço sugerido</dt>
          <dd className="kuteka-detail-value">{formatAoa(row.suggested_price_aoa, 'sale')}</dd>
        </div>
      </dl>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {scores.map((s) => (
          <li key={s.label} className="kuteka-detail-chip">
            {s.label}: {s.value != null ? Number(s.value).toFixed(1) : '—'}
          </li>
        ))}
      </ul>

      {checklistEntries.length ? (
        <div className="mt-5">
          <h3 className="kuteka-detail-subtitle">Checklist técnica</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {checklistEntries.map(([key, val]) => (
              <li key={key} className="kuteka-detail-chip">
                {key}: {String(val)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {row.valuation_plan ? (
        <div className="mt-5">
          <h3 className="kuteka-detail-subtitle">Plano de valorização</h3>
          <p className="kuteka-detail-body mt-2 whitespace-pre-wrap">{row.valuation_plan}</p>
        </div>
      ) : null}

      {row.counter_proposal_notes ? (
        <div className="mt-5">
          <h3 className="kuteka-detail-subtitle">Contraproposta de preço</h3>
          <p className="kuteka-detail-body mt-2 whitespace-pre-wrap">
            {row.counter_proposal_notes}
          </p>
        </div>
      ) : null}

      {row.report_notes ? (
        <div className="mt-5">
          <h3 className="kuteka-detail-subtitle">Relatório técnico</h3>
          <p className="kuteka-detail-body mt-2 whitespace-pre-wrap">{row.report_notes}</p>
        </div>
      ) : null}
    </section>
  );
}
