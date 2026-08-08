'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { LOCALE_INTL_TAG, type AppLocale } from '@/modules/i18n/types';
import { getListingsCopy } from '../content';
import { getServiceLabels } from '../lib/manual-ops-labels';

type ServiceContract = {
  id: string;
  code: string;
  service_type: string;
  exclusivity: string;
  status: string;
  version?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  signed_at?: string | null;
  signature_name?: string | null;
  document_url?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  commission_notes: string | null;
  terms_notes: string | null;
  requested_services: unknown;
  created_at: string;
  updated_at?: string;
};

function fmtDate(value: string | null | undefined, locale: AppLocale): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(LOCALE_INTL_TAG[locale]);
  } catch {
    return value;
  }
}

/**
 * Contrato Kuteka ↔ Parceiro Patrimonial — Manual Cap.7 (contrato real).
 */
export function PropertyServiceContractPanel({ propertyId }: { propertyId: string }) {
  const { locale } = useLocale();
  const copy = getListingsCopy(locale).serviceContract;
  const serviceLabels = getServiceLabels(locale);
  const typeLabels = copy.types as Record<string, string>;
  const statusLabels = copy.status as Record<string, string>;
  const [rows, setRows] = useState<ServiceContract[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = createBrowserClient();
        const full = await client
          .from('partner_service_contracts')
          .select(
            'id, code, service_type, exclusivity, status, version, valid_from, valid_until, signed_at, signature_name, document_url, cancelled_at, cancel_reason, commission_notes, terms_notes, requested_services, created_at, updated_at',
          )
          .eq('property_id', propertyId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(6);

        if (!cancelled) {
          if (!full.error) {
            setRows((full.data as ServiceContract[]) ?? []);
          } else {
            const legacy = await client
              .from('partner_service_contracts')
              .select(
                'id, code, service_type, exclusivity, status, commission_notes, terms_notes, requested_services, created_at',
              )
              .eq('property_id', propertyId)
              .is('deleted_at', null)
              .order('created_at', { ascending: false })
              .limit(6);
            setRows(legacy.error ? [] : ((legacy.data as ServiceContract[]) ?? []));
          }
          setLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setRows([]);
          setLoaded(true);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  return (
    <section
      id="contrato-kuteka"
      className="kuteka-detail-panel p-5 sm:p-6"
      aria-labelledby="svc-contract-heading"
    >
      <div className="border-b border-[var(--kuteka-detail-line)] pb-4">
        <p className="kuteka-detail-eyebrow">{copy.eyebrow}</p>
        <h2 id="svc-contract-heading" className="kuteka-detail-title mt-1">
          {copy.title}
        </h2>
        <p className="kuteka-detail-meta mt-1">{copy.subtitle}</p>
      </div>

      {!loaded ? <p className="kuteka-detail-meta mt-4">{copy.loading}</p> : null}

      {loaded && rows.length === 0 ? <p className="kuteka-detail-body mt-4">{copy.empty}</p> : null}

      {rows.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-4">
          {rows.map((row) => {
            const services = Array.isArray(row.requested_services)
              ? row.requested_services.filter((s): s is string => typeof s === 'string')
              : [];
            return (
              <li key={row.id} className="kuteka-detail-review">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-sm font-semibold text-[#08263f]">{row.code}</p>
                    <p className="kuteka-detail-meta mt-0.5">
                      {copy.versionExclusivityTemplate
                        .replace('{version}', row.version || '1.0')
                        .replace('{exclusivity}', row.exclusivity)}
                    </p>
                  </div>
                  <span className="kuteka-detail-chip kuteka-detail-chip--accent">
                    {statusLabels[row.status] ?? row.status}
                  </span>
                </div>

                <p className="kuteka-detail-body mt-3 font-medium">
                  {typeLabels[row.service_type] ?? row.service_type}
                </p>

                <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="kuteka-detail-label">{copy.created}</dt>
                    <dd className="kuteka-detail-value text-sm">
                      {fmtDate(row.created_at, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt className="kuteka-detail-label">{copy.validFrom}</dt>
                    <dd className="kuteka-detail-value text-sm">
                      {fmtDate(row.valid_from, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt className="kuteka-detail-label">{copy.validUntil}</dt>
                    <dd className="kuteka-detail-value text-sm">
                      {fmtDate(row.valid_until, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt className="kuteka-detail-label">{copy.signature}</dt>
                    <dd className="kuteka-detail-value text-sm">
                      {row.signature_name
                        ? `${row.signature_name} · ${fmtDate(row.signed_at, locale)}`
                        : row.status === 'pending_acceptance'
                          ? copy.awaitingAcceptance
                          : copy.pending}
                    </dd>
                  </div>
                </dl>

                {services.length ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {services.map((svc) => (
                      <li key={svc} className="kuteka-detail-chip">
                        {serviceLabels[svc] ?? svc}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {row.terms_notes ? (
                  <p className="kuteka-detail-body mt-3 whitespace-pre-wrap">{row.terms_notes}</p>
                ) : null}
                {row.commission_notes ? (
                  <p className="kuteka-detail-meta mt-2">{row.commission_notes}</p>
                ) : null}

                {row.cancelled_at ? (
                  <p className="mt-2 text-sm font-medium text-red-700">
                    {copy.cancelledOnTemplate.replace('{date}', fmtDate(row.cancelled_at, locale))}
                    {row.cancel_reason ? ` — ${row.cancel_reason}` : ''}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="kuteka-detail-chip kuteka-detail-chip--accent"
                  >
                    {copy.downloadPdf}
                  </button>
                  {row.document_url ? (
                    <a
                      href={row.document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="kuteka-detail-chip kuteka-detail-chip--accent"
                    >
                      {copy.openDocument}
                    </a>
                  ) : null}
                  {row.status === 'active' ? (
                    <span className="kuteka-detail-chip">{copy.renewalContact}</span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
