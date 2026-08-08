'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getListingsCopy } from '../content';
import {
  asHistoryList,
  getConstructionLabels,
  getConservationLabels,
  getManagementLabels,
  getRenovationLabels,
  getServiceLabels,
  getUnfinishedLabels,
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
  const { locale } = useLocale();
  const copy = getListingsCopy(locale).passport;
  const constructionLabels = getConstructionLabels(locale);
  const conservationLabels = getConservationLabels(locale);
  const managementLabels = getManagementLabels(locale);
  const renovationLabels = getRenovationLabels(locale);
  const serviceLabels = getServiceLabels(locale);
  const unfinishedLabels = getUnfinishedLabels(locale);
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
            <p className="kuteka-detail-eyebrow">{copy.eyebrow}</p>
            <h2 id="pdk-heading" className="kuteka-detail-title mt-1">
              {copy.title}
            </h2>
            <p className="kuteka-detail-meta mt-1 font-mono">{pdk}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={printPdk}
          className="kuteka-detail-chip kuteka-detail-chip--accent inline-flex items-center gap-1.5 px-3 py-2"
        >
          {copy.printButton}
        </button>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
        <KutekaScoreGauge score={row.kuteka_score} size="md" />
        <dl className="grid gap-4 sm:grid-cols-2">
          <Fact label={copy.propertyCode} value={row.code} />
          <Fact
            label={copy.yearBuilt}
            value={row.year_built != null ? String(row.year_built) : '—'}
          />
          <Fact
            label={copy.constructionStatus}
            value={
              constructionLabels[row.construction_status ?? ''] ?? row.construction_status ?? '—'
            }
          />
          <Fact
            label={copy.conservation}
            value={
              conservationLabels[row.conservation_state ?? ''] ?? row.conservation_state ?? '—'
            }
          />
          <Fact
            label={copy.contractedManagement}
            value={managementLabels[row.management_level ?? ''] ?? row.management_level ?? '—'}
          />
          <Fact
            label={copy.unfinishedWorks}
            value={unfinishedLabels[row.unfinished_intent ?? ''] ?? row.unfinished_intent ?? '—'}
          />
        </dl>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <StatChip label={copy.owners} value={Math.max(owners.length, 1)} />
        <StatChip label={copy.contracts} value={contractCount} />
        <StatChip label={copy.reviews} value={reviewCount} />
        <StatChip label={copy.maintenances} value={maintenance.length} />
        <StatChip label={copy.photos} value={mediaCount} />
      </div>

      {services.length ? (
        <div className="mt-5">
          <h3 className="kuteka-detail-subtitle">{copy.kutekaServices}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {services.map((svc) => (
              <li key={svc} className="kuteka-detail-chip kuteka-detail-chip--accent">
                {serviceLabels[svc] ?? svc}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {renovations.length ? (
        <div className="mt-4">
          <h3 className="kuteka-detail-subtitle">{copy.renovations}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {renovations.map((item) => (
              <li key={item} className="kuteka-detail-chip">
                {renovationLabels[item] ?? item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <MiniHistory
          title={copy.ownerHistory}
          items={owners}
          empty={copy.ownerHistoryEmpty}
          indexLabel={copy.indexLabel}
        />
        <MiniHistory
          title={copy.commercialHistory}
          items={valuations}
          empty={copy.historyEmpty}
          indexLabel={copy.indexLabel}
        />
        <MiniHistory
          title={copy.maintenanceHistory}
          items={maintenance}
          empty={copy.historyEmpty}
          indexLabel={copy.indexLabel}
        />
        <MiniHistory
          title={copy.inspectionHistory}
          items={inspections}
          empty={copy.historyEmpty}
          indexLabel={copy.indexLabel}
        />
      </div>

      {(row.legal_notes || row.commercial_notes || row.documents_url) && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {row.legal_notes ? (
            <div className="kuteka-detail-review">
              <h3 className="kuteka-detail-subtitle">{copy.legalDocs}</h3>
              <p className="kuteka-detail-body mt-1">{row.legal_notes}</p>
            </div>
          ) : null}
          {row.commercial_notes ? (
            <div className="kuteka-detail-review">
              <h3 className="kuteka-detail-subtitle">{copy.commercialNotes}</h3>
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
              {copy.openDocuments}
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
  empty,
  indexLabel,
}: {
  title: string;
  items: Array<{ at?: string; note?: string; score?: number }>;
  empty: string;
  indexLabel: string;
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
              {item.note ??
                (item.score != null ? indexLabel.replace('{score}', String(item.score)) : '—')}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
