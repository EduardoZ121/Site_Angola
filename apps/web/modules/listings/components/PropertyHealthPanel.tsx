'use client';

import { formatAoa } from '@/lib/format/aoa';
import { CONSERVATION_LABELS, LIFECYCLE_LABELS, asHistoryList } from '../lib/manual-ops-labels';
import type { EnrichedListing } from '../types';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="kuteka-detail-fact">
      <dt className="kuteka-detail-label">{label}</dt>
      <dd className="kuteka-detail-value">{value}</dd>
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

/**
 * Painel de Saúde do Património — Manual Cap.10.10.
 * Additive panel; does not alter Showcase chrome.
 */
export function PropertyHealthPanel({ row }: { row: EnrichedListing }) {
  const score = row.kuteka_score != null ? Number(row.kuteka_score) : null;
  const maintenance = asHistoryList(row.maintenance_history);
  const inspections = asHistoryList(row.inspection_history);
  const valuations = asHistoryList(row.valuation_history);

  return (
    <section className="kuteka-detail-panel p-5 sm:p-6" aria-labelledby="health-heading">
      <div className="border-b border-[var(--kuteka-detail-line)] pb-4">
        <p className="kuteka-detail-eyebrow">Gestão patrimonial</p>
        <h2 id="health-heading" className="kuteka-detail-title mt-1">
          Painel de Saúde do Património
        </h2>
        <p className="kuteka-detail-meta mt-1">
          Índice Kuteka, estado geral, manutenção, inspeções e evolução do imóvel.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-6">
        <div>
          <p className="kuteka-detail-label">Índice Kuteka</p>
          <p className="mt-1 font-mono text-3xl font-semibold tracking-tight text-[var(--kuteka-detail-ink)]">
            {score != null ? score.toFixed(0) : '—'}
            <span className="ml-1 text-base font-normal text-[var(--kuteka-detail-muted)]">
              /100
            </span>
          </p>
        </div>
        {row.needs_renovation ? (
          <span className="kuteka-detail-chip kuteka-detail-chip--accent">
            Necessita remodelação
          </span>
        ) : (
          <span className="kuteka-detail-chip">Sem remodelação urgente</span>
        )}
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric
          label="Estado geral (ciclo)"
          value={
            LIFECYCLE_LABELS[row.lifecycle_status ?? ''] ?? row.lifecycle_status ?? 'Em preparação'
          }
        />
        <Metric
          label="Conservação"
          value={CONSERVATION_LABELS[row.conservation_state ?? ''] ?? row.conservation_state ?? '—'}
        />
        <Metric label="Valor estimado" value={formatAoa(row.price_aoa, row.purpose)} />
        <Metric label="Última manutenção" value={formatDate(row.last_maintenance_at)} />
        <Metric label="Última inspeção" value={formatDate(row.last_inspection_at)} />
        <Metric
          label="Próxima manutenção"
          value={
            row.last_maintenance_at
              ? formatDate(
                  new Date(
                    new Date(row.last_maintenance_at).getTime() + 90 * 86400000,
                  ).toISOString(),
                )
              : 'A definir'
          }
        />
      </dl>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <HistoryBlock title="Histórico técnico / manutenção" items={maintenance} />
        <HistoryBlock title="Histórico de inspeções" items={inspections} />
        <HistoryBlock
          title="Histórico comercial / valorizações"
          items={valuations.map((v) => ({
            at: v.at,
            note: v.score != null ? `Índice ${v.score}${v.note ? ` · ${v.note}` : ''}` : v.note,
          }))}
        />
      </div>

      {(row.legal_notes || row.commercial_notes) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {row.legal_notes ? (
            <div>
              <h3 className="kuteka-detail-subtitle">Histórico jurídico</h3>
              <p className="kuteka-detail-body mt-2 whitespace-pre-wrap">{row.legal_notes}</p>
            </div>
          ) : null}
          {row.commercial_notes ? (
            <div>
              <h3 className="kuteka-detail-subtitle">Histórico comercial</h3>
              <p className="kuteka-detail-body mt-2 whitespace-pre-wrap">{row.commercial_notes}</p>
            </div>
          ) : null}
        </div>
      )}
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
