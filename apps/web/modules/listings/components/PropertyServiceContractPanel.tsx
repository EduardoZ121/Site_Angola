'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useLocale } from '@/modules/i18n/LocaleProvider';
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

const TYPE_LABELS: Record<string, string> = {
  intermediation_sale: 'Intermediação de venda',
  intermediation_rent: 'Intermediação de arrendamento',
  full_management: 'Gestão total',
  patrimonial_valuation: 'Valorização patrimonial',
  legal_admin: 'Serviços jurídicos e administrativos',
  photography: 'Sessão fotográfica',
  technical_visit: 'Visita técnica',
  renovation: 'Remodelação',
  construction_finish: 'Conclusão de construção',
  home_staging: 'Home Staging',
  cleaning: 'Limpeza',
  maintenance: 'Manutenção',
  works_supervision: 'Fiscalização de obra',
  condo_admin: 'Administração de condomínio',
  evaluation: 'Avaliação profissional',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  pending_acceptance: 'Pendente de aceitação',
  active: 'Activo',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('pt-AO');
  } catch {
    return value;
  }
}

/**
 * Contrato Kuteka ↔ Parceiro Patrimonial — Manual Cap.7 (contrato real).
 */
export function PropertyServiceContractPanel({ propertyId }: { propertyId: string }) {
  const { locale } = useLocale();
  const serviceLabels = getServiceLabels(locale);
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
        <p className="kuteka-detail-eyebrow">Manual Cap.7</p>
        <h2 id="svc-contract-heading" className="kuteka-detail-title mt-1">
          Contrato de serviços Kuteka ↔ Parceiro
        </h2>
        <p className="kuteka-detail-meta mt-1">
          Estado, validade, assinatura e histórico — distinto do contrato Cliente–Parceiro.
        </p>
      </div>

      {!loaded ? <p className="kuteka-detail-meta mt-4">A carregar contratos…</p> : null}

      {loaded && rows.length === 0 ? (
        <p className="kuteka-detail-body mt-4">
          Ainda não existe contrato de serviços. Ao activar património com serviços Kuteka, o
          sistema gera automaticamente um rascunho contratual.
        </p>
      ) : null}

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
                      Versão {row.version || '1.0'} · Exclusividade: {row.exclusivity}
                    </p>
                  </div>
                  <span className="kuteka-detail-chip kuteka-detail-chip--accent">
                    {STATUS_LABELS[row.status] ?? row.status}
                  </span>
                </div>

                <p className="kuteka-detail-body mt-3 font-medium">
                  {TYPE_LABELS[row.service_type] ?? row.service_type}
                </p>

                <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="kuteka-detail-label">Criado</dt>
                    <dd className="kuteka-detail-value text-sm">{fmtDate(row.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="kuteka-detail-label">Válido de</dt>
                    <dd className="kuteka-detail-value text-sm">{fmtDate(row.valid_from)}</dd>
                  </div>
                  <div>
                    <dt className="kuteka-detail-label">Válido até</dt>
                    <dd className="kuteka-detail-value text-sm">{fmtDate(row.valid_until)}</dd>
                  </div>
                  <div>
                    <dt className="kuteka-detail-label">Assinatura</dt>
                    <dd className="kuteka-detail-value text-sm">
                      {row.signature_name
                        ? `${row.signature_name} · ${fmtDate(row.signed_at)}`
                        : row.status === 'pending_acceptance'
                          ? 'Aguarda aceitação'
                          : 'Pendente'}
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
                    Cancelado em {fmtDate(row.cancelled_at)}
                    {row.cancel_reason ? ` — ${row.cancel_reason}` : ''}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="kuteka-detail-chip kuteka-detail-chip--accent"
                  >
                    Download / imprimir PDF
                  </button>
                  {row.document_url ? (
                    <a
                      href={row.document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="kuteka-detail-chip kuteka-detail-chip--accent"
                    >
                      Abrir documento
                    </a>
                  ) : null}
                  {row.status === 'active' ? (
                    <span className="kuteka-detail-chip">Renovação: contacte a Kuteka</span>
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
