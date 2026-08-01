'use client';

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

/**
 * Passaporte Digital do Imóvel (PDK) — Manual Cap.5.3.
 * Additive information block; does not redesign the Showcase.
 */
export function PropertyDigitalPassport({ row }: { row: EnrichedListing }) {
  const pdk = row.pdk_code || `PDK-${row.code}`;
  const owners = asHistoryList(row.owner_history);
  const maintenance = asHistoryList(row.maintenance_history);
  const inspections = asHistoryList(row.inspection_history);
  const valuations = asHistoryList(row.valuation_history);
  const services = asStringList(row.requested_services);
  const renovations = asStringList(row.renovation_requests);

  return (
    <section className="kuteka-detail-panel p-5 sm:p-6" aria-labelledby="pdk-heading">
      <div className="border-b border-[var(--kuteka-detail-line)] pb-4">
        <p className="kuteka-detail-eyebrow">Identidade digital permanente</p>
        <h2 id="pdk-heading" className="kuteka-detail-title mt-1">
          Passaporte Digital do Imóvel
        </h2>
        <p className="kuteka-detail-meta mt-1">
          Código único, histórico e Índice de Qualidade Kuteka — acompanha o imóvel ao longo do
          ciclo de vida.
        </p>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Fact label="Código PDK" value={pdk} />
        <Fact label="Código patrimonial" value={row.code} />
        <Fact
          label="Índice de Qualidade Kuteka"
          value={
            row.kuteka_score != null ? `${Number(row.kuteka_score).toFixed(0)} / 100` : 'Pendente'
          }
        />
        <Fact
          label="Gestão contratada"
          value={MANAGEMENT_LABELS[row.management_level ?? ''] ?? row.management_level ?? '—'}
        />
        <Fact
          label="Estado da construção"
          value={
            CONSTRUCTION_LABELS[row.construction_status ?? ''] ?? row.construction_status ?? '—'
          }
        />
        <Fact
          label="Conservação"
          value={CONSERVATION_LABELS[row.conservation_state ?? ''] ?? row.conservation_state ?? '—'}
        />
        <Fact
          label="Obra inacabada"
          value={UNFINISHED_LABELS[row.unfinished_intent ?? ''] ?? row.unfinished_intent ?? '—'}
        />
      </dl>

      {services.length ? (
        <div className="mt-5">
          <h3 className="kuteka-detail-subtitle">Serviços Kuteka solicitados</h3>
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
        <div className="mt-5">
          <h3 className="kuteka-detail-subtitle">Pedidos de valorização</h3>
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
        <MiniHistory title="Histórico de proprietários" items={owners} />
        <MiniHistory title="Valorizações registadas" items={valuations} />
        <MiniHistory title="Manutenção" items={maintenance} />
        <MiniHistory title="Inspeções" items={inspections} />
      </div>

      <p className="kuteka-detail-meta mt-5">
        Fotografias históricas, vídeos, documentação validada e avaliações dos ocupantes integram
        este PDK através da galeria, documentos e reputação abaixo.
      </p>
    </section>
  );
}

function MiniHistory({
  title,
  items,
}: {
  title: string;
  items: Array<{ at?: string; note?: string; score?: number }>;
}) {
  return (
    <div>
      <h3 className="kuteka-detail-subtitle">{title}</h3>
      {items.length === 0 ? (
        <p className="kuteka-detail-meta mt-2">Sem registos.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {items.slice(0, 4).map((item, idx) => (
            <li key={`${title}-${idx}`} className="kuteka-detail-body text-sm">
              <span className="kuteka-detail-meta">{item.at ?? '—'}</span>
              {' · '}
              {item.note ?? (item.score != null ? `Score ${item.score}` : '—')}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
