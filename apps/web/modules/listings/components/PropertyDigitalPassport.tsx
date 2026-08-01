'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  CONSTRUCTION_LABELS,
  CONSERVATION_LABELS,
  MANAGEMENT_LABELS,
  RENOVATION_LABELS,
  SERVICE_LABELS,
  UNFINISHED_LABELS,
  asHistoryList,
} from '../lib/manual-ops-labels';
import type { EnrichedListing } from '../types';
import { KutekaScoreGauge } from './KutekaScoreGauge';

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="kuteka-detail-fact">
      <dt className="kuteka-detail-label">{label}</dt>
      <dd className="kuteka-detail-value">{value}</dd>
    </div>
  );
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function StatChip({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col items-center rounded-kuteka border border-[var(--kuteka-detail-line)] bg-white/70 px-3 py-2.5 text-center">
      <p className="font-mono text-lg font-bold text-[#08263f]">{value}</p>
      <p className="mt-0.5 text-[0.7rem] font-medium text-slate-600">{label}</p>
    </div>
  );
}

/**
 * Passaporte Digital do Imóvel (PDK) — Manual Cap.5.3.
 * Auto-fed from property histories, media, reviews and contracts.
 */
export function PropertyDigitalPassport({
  row,
  mediaCount = 0,
}: {
  row: EnrichedListing;
  mediaCount?: number;
}) {
  const pdk = row.pdk_code || `PDK-${row.code}`;
  const owners = asHistoryList(row.owner_history);
  const maintenance = asHistoryList(row.maintenance_history);
  const inspections = asHistoryList(row.inspection_history);
  const valuations = asHistoryList(row.valuation_history);
  const services = asStringList(row.requested_services);
  const renovations = asStringList(row.renovation_requests);
  const [reviewCount, setReviewCount] = useState(0);
  const [contractCount, setContractCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = createBrowserClient();
        const [reviews, contracts] = await Promise.all([
          client
            .from('contract_reviews')
            .select('id', { count: 'exact', head: true })
            .eq('property_id', row.id),
          client
            .from('property_contracts')
            .select('id', { count: 'exact', head: true })
            .eq('property_id', row.id)
            .is('deleted_at', null),
        ]);
        if (!cancelled) {
          setReviewCount(reviews.count ?? 0);
          setContractCount(contracts.count ?? 0);
        }
      } catch {
        if (!cancelled) {
          setReviewCount(0);
          setContractCount(0);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [row.id]);

  function printPdk() {
    window.print();
  }

  return (
    <section
      id="pdk"
      className="kuteka-detail-panel p-5 sm:p-6"
      aria-labelledby="pdk-heading"
      data-print="pdk"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--kuteka-detail-line)] pb-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 flex size-10 items-center justify-center rounded-full bg-[#08263f] text-white"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <path d="M12 3 4.5 6.5V12c0 5 3.2 8.3 7.5 9.5C16.3 20.3 19.5 17 19.5 12V6.5L12 3Z" />
              <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <p className="kuteka-detail-eyebrow">Passaporte Digital KTK</p>
            <h2 id="pdk-heading" className="kuteka-detail-title mt-1">
              Identidade permanente do imóvel
            </h2>
            <p className="kuteka-detail-meta mt-1 font-mono">{pdk}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={printPdk}
          className="kuteka-detail-chip kuteka-detail-chip--accent inline-flex items-center gap-1.5 px-3 py-2"
        >
          Ver / imprimir documento
        </button>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
        <KutekaScoreGauge score={row.kuteka_score} size="md" />
        <dl className="grid gap-4 sm:grid-cols-2">
          <Fact label="Código patrimonial" value={row.code} />
          <Fact
            label="Ano de construção"
            value={row.year_built != null ? String(row.year_built) : '—'}
          />
          <Fact
            label="Estado da construção"
            value={
              CONSTRUCTION_LABELS[row.construction_status ?? ''] ?? row.construction_status ?? '—'
            }
          />
          <Fact
            label="Conservação"
            value={
              CONSERVATION_LABELS[row.conservation_state ?? ''] ?? row.conservation_state ?? '—'
            }
          />
          <Fact
            label="Gestão contratada"
            value={MANAGEMENT_LABELS[row.management_level ?? ''] ?? row.management_level ?? '—'}
          />
          <Fact
            label="Obra inacabada"
            value={UNFINISHED_LABELS[row.unfinished_intent ?? ''] ?? row.unfinished_intent ?? '—'}
          />
        </dl>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <StatChip label="Proprietários" value={Math.max(owners.length, 1)} />
        <StatChip label="Contratos" value={contractCount} />
        <StatChip label="Avaliações" value={reviewCount} />
        <StatChip label="Manutenções" value={maintenance.length} />
        <StatChip label="Fotografias" value={mediaCount} />
      </div>

      {services.length ? (
        <div className="mt-5">
          <h3 className="kuteka-detail-subtitle">Serviços Kuteka</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {services.map((svc) => (
              <li key={svc} className="kuteka-detail-chip kuteka-detail-chip--accent">
                {SERVICE_LABELS[svc] ?? svc}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {renovations.length ? (
        <div className="mt-4">
          <h3 className="kuteka-detail-subtitle">Remodelações / valorização</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {renovations.map((item) => (
              <li key={item} className="kuteka-detail-chip">
                {RENOVATION_LABELS[item] ?? item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <MiniHistory
          title="Histórico de proprietários"
          items={owners}
          empty="Titular actual na Kuteka"
        />
        <MiniHistory title="Histórico comercial / valorizações" items={valuations} />
        <MiniHistory title="Histórico de manutenção" items={maintenance} />
        <MiniHistory title="Histórico de inspeções" items={inspections} />
      </div>

      {(row.legal_notes || row.commercial_notes || row.documents_url) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {row.legal_notes ? (
            <div className="kuteka-detail-review">
              <h3 className="kuteka-detail-subtitle">Documentação / jurídico</h3>
              <p className="kuteka-detail-body mt-1">{row.legal_notes}</p>
            </div>
          ) : null}
          {row.commercial_notes ? (
            <div className="kuteka-detail-review">
              <h3 className="kuteka-detail-subtitle">Notas comerciais</h3>
              <p className="kuteka-detail-body mt-1">{row.commercial_notes}</p>
            </div>
          ) : null}
          {row.documents_url ? (
            <a
              href={row.documents_url}
              target="_blank"
              rel="noreferrer"
              className="kuteka-detail-chip kuteka-detail-chip--accent w-fit"
            >
              Abrir documentos validados
            </a>
          ) : null}
        </div>
      )}
    </section>
  );
}

function MiniHistory({
  title,
  items,
  empty = 'Sem registos ainda — serão adicionados ao longo do ciclo de vida.',
}: {
  title: string;
  items: Array<{ at?: string; note?: string; score?: number }>;
  empty?: string;
}) {
  return (
    <div>
      <h3 className="kuteka-detail-subtitle">{title}</h3>
      {items.length === 0 ? (
        <p className="kuteka-detail-meta mt-2">{empty}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {items.slice(0, 5).map((item, idx) => (
            <li key={`${title}-${idx}`} className="kuteka-detail-body text-sm">
              <span className="font-medium text-[#08263f]">{item.at ?? '—'}</span>
              {' · '}
              {item.note ?? (item.score != null ? `Índice ${item.score}` : '—')}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
