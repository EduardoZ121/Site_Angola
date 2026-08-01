'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { SERVICE_LABELS } from '../lib/manual-ops-labels';

type ServiceContract = {
  id: string;
  code: string;
  service_type: string;
  exclusivity: string;
  status: string;
  commission_notes: string | null;
  terms_notes: string | null;
  requested_services: unknown;
  created_at: string;
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

/**
 * Contrato Kuteka ↔ Parceiro Patrimonial — Manual Cap.7.
 */
export function PropertyServiceContractPanel({ propertyId }: { propertyId: string }) {
  const [rows, setRows] = useState<ServiceContract[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = createBrowserClient();
        const { data, error } = await client
          .from('partner_service_contracts')
          .select(
            'id, code, service_type, exclusivity, status, commission_notes, terms_notes, requested_services, created_at',
          )
          .eq('property_id', propertyId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(6);
        if (!cancelled) {
          setRows(error ? [] : ((data as ServiceContract[]) ?? []));
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
    <section className="kuteka-detail-panel p-5 sm:p-6" aria-labelledby="svc-contract-heading">
      <div className="border-b border-[var(--kuteka-detail-line)] pb-4">
        <p className="kuteka-detail-eyebrow">Manual Cap.7</p>
        <h2 id="svc-contract-heading" className="kuteka-detail-title mt-1">
          Contrato de serviços Kuteka ↔ Parceiro
        </h2>
        <p className="kuteka-detail-meta mt-1">
          Distinto do contrato Cliente–Parceiro — define intermediação, gestão e valorização.
        </p>
      </div>

      {!loaded ? <p className="kuteka-detail-meta mt-4">A carregar contratos…</p> : null}

      {loaded && rows.length === 0 ? (
        <p className="kuteka-detail-body mt-4">
          Ainda não existe contrato de serviços associado. Ao activar património com serviços
          Kuteka, o sistema gera automaticamente um rascunho contratual.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-3">
          {rows.map((row) => {
            const services = Array.isArray(row.requested_services)
              ? row.requested_services.filter((s): s is string => typeof s === 'string')
              : [];
            return (
              <li key={row.id} className="kuteka-detail-review">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm">{row.code}</span>
                  <span className="kuteka-detail-chip kuteka-detail-chip--accent">
                    {STATUS_LABELS[row.status] ?? row.status}
                  </span>
                </div>
                <p className="kuteka-detail-body mt-2">
                  {TYPE_LABELS[row.service_type] ?? row.service_type}
                  {' · '}
                  Exclusividade: {row.exclusivity}
                </p>
                {services.length ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {services.map((svc) => (
                      <li key={svc} className="kuteka-detail-chip">
                        {SERVICE_LABELS[svc] ?? svc}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {row.terms_notes ? (
                  <p className="kuteka-detail-meta mt-2">{row.terms_notes}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
