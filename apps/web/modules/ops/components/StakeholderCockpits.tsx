'use client';

import Link from 'next/link';
import { formatAoa, formatDays } from '../format';
import type { OpsStats } from '../types';
import { OpsCockpitShell } from './OpsCockpitShell';

export function ClientOpsCockpit({ s, loading }: { s: OpsStats | null; loading: boolean }) {
  const active = s?.clientContracts.find((c) => c.status === 'active');
  return (
    <OpsCockpitShell
      loading={loading}
      eyebrow="Cliente · Residência"
      title="Centro de gestão da habitação"
      subtitle="Contrato, pagamentos, calendário, comunicações e intenção de saída."
      stats={[
        { label: 'Dias restantes', value: formatDays(active?.daysRemaining) },
        {
          label: 'Próxima renda',
          value:
            active?.nextPaymentAmountAoa != null ? formatAoa(active.nextPaymentAmountAoa) : '—',
        },
        { label: 'Pagamentos feitos', value: String(s?.paymentsPaid ?? 0) },
        { label: 'Em atraso', value: String(s?.paymentsLate ?? 0) },
        { label: 'Manutenções abertas', value: String(s?.maintenanceOpen ?? 0) },
        { label: 'Interesses', value: String(s?.interests ?? 0) },
        { label: 'Caução', value: formatAoa(active?.depositAoa) },
        {
          label: 'Estado contrato',
          value: active?.status ?? 'sem contrato activo',
        },
      ]}
      links={[
        { href: '/app/habitacao?vista=residencia', label: 'Cockpit residência', primary: true },
        { href: '/app/contratos', label: 'Contratos' },
        { href: '/app/habitacao/explorar?disponibilidade=futura', label: 'Disponibilidade futura' },
        { href: '/app/habitacao/explorar', label: 'Explorar' },
      ]}
    >
      {active ? (
        <div className="kuteka-ops-block mt-4">
          <p className="kuteka-ops-block__title">{active.propertyTitle ?? 'Imóvel actual'}</p>
          <p className="kuteka-ops-block__meta">
            {active.propertyCode} · {active.startsOn ?? '—'} → {active.endsOn ?? '—'}
            {active.exitIntent !== 'none'
              ? ` · Saída: ${active.exitIntent}${active.exitIntentDate ? ` (${active.exitIntentDate})` : ''}`
              : ''}
          </p>
          <p className="kuteka-ops-block__meta mt-1">
            Calendário: próximo pagamento {active.nextPaymentDue ?? '—'} · renovação / inspeções no
            hub de residência.
          </p>
        </div>
      ) : (
        <p className="kuteka-detail-meta mt-4">
          Ainda sem contrato activo — explore habitação ou acompanhe propostas.
        </p>
      )}
    </OpsCockpitShell>
  );
}

export function PartnerOpsCockpit({ s, loading }: { s: OpsStats | null; loading: boolean }) {
  const soon = s?.futureProperties[0];
  return (
    <OpsCockpitShell
      loading={loading}
      eyebrow="Parceiro Patrimonial"
      title="Gestão inteligente do património"
      subtitle="Receitas, ocupação, contratos, previsão de libertação e pipeline comercial."
      stats={[
        { label: 'Receita mensal', value: formatAoa(s?.monthlyRevenueAoa) },
        { label: 'Receita anual', value: formatAoa(s?.annualRevenueAoa) },
        { label: 'Ocupação', value: s?.occupancyPct != null ? `${s.occupancyPct}%` : '—' },
        { label: 'Ocupados', value: String(s?.propertiesOccupied ?? 0) },
        { label: 'Disponíveis', value: String(s?.propertiesAvailable ?? 0) },
        { label: 'Prestes a libertar', value: String(s?.propertiesFutureFree ?? 0) },
        { label: 'Contratos activos', value: String(s?.partnerContractsActive ?? 0) },
        { label: 'A vencer (60d)', value: String(s?.partnerContractsExpiring ?? 0) },
        { label: 'Interessados', value: String(s?.pipelineInterests ?? 0) },
        { label: 'Visitas 30d', value: String(s?.pipelineVisits30 ?? 0) },
        { label: 'Propostas 30d', value: String(s?.pipelineProposals30 ?? 0) },
        {
          label: 'Avaliação',
          value: s?.reviewAvg != null ? `${s.reviewAvg.toFixed(1)}★` : '—',
        },
      ]}
      links={[
        { href: '/app/patrimonios', label: 'Patrimónios', primary: true },
        { href: '/app/contratos', label: 'Contratos' },
        { href: '/app/habitacao/explorar?disponibilidade=futura', label: 'Libertações futuras' },
        { href: '/app/confianca', label: 'Confiança' },
      ]}
    >
      <div className="kuteka-ops-pipeline mt-4">
        <p className="kuteka-ops-block__title">Pipeline comercial</p>
        <p className="kuteka-ops-pipeline__flow">
          Interessados → Visitas → Propostas → Negociação → Contrato → Mudança → Ocupação →
          Renovação
        </p>
        {soon ? (
          <p className="kuteka-ops-block__meta mt-2">
            Previsão KAI: <strong>{soon.title ?? soon.code}</strong> deverá ficar disponível em{' '}
            <strong>~{soon.daysUntilFree} dias</strong>
            {soon.availabilityNote ? ` — ${soon.availabilityNote}` : ''}.
          </p>
        ) : null}
      </div>
    </OpsCockpitShell>
  );
}

export function AgentOpsCockpit({ s, loading }: { s: OpsStats | null; loading: boolean }) {
  return (
    <OpsCockpitShell
      loading={loading}
      eyebrow="Agente · CRM"
      title="Pipeline no terreno"
      subtitle="Clientes, visitas, imóveis urgentes, avaliações e comissões."
      stats={[
        { label: 'Imóveis atribuídos', value: String(s?.assignments ?? 0) },
        { label: 'Contratos', value: String(s?.agentContracts ?? 0) },
        { label: 'Libertações futuras', value: String(s?.propertiesFutureFree ?? 0) },
        { label: 'Interessados (rede)', value: String(s?.pipelineInterests ?? 0) },
        { label: 'Visitas 30d', value: String(s?.pipelineVisits30 ?? 0) },
        { label: 'Propostas 30d', value: String(s?.pipelineProposals30 ?? 0) },
      ]}
      links={[
        { href: '/app/agente', label: 'CRM Agente', primary: true },
        { href: '/app/agente/explorar', label: 'Inventário' },
        { href: '/app/contratos', label: 'Assinaturas' },
        { href: '/app/habitacao/explorar?disponibilidade=futura', label: 'Urgentes / futuros' },
      ]}
    />
  );
}

export function AdminOpsCockpit({
  s,
  loading,
  executive,
}: {
  s: OpsStats | null;
  loading: boolean;
  executive?: boolean;
}) {
  return (
    <OpsCockpitShell
      loading={loading}
      eyebrow={executive ? 'SuperAdministrador · Executivo' : 'Administrador · Operações'}
      title={executive ? 'Cockpit executivo' : 'Cockpit operacional'}
      subtitle={
        executive
          ? 'Património sob gestão, receitas, crescimento, ocupação e satisfação.'
          : 'Imóveis, contratos, libertações, pagamentos e novos stakeholders.'
      }
      stats={[
        { label: 'Utilizadores', value: String(s?.users ?? 0) },
        { label: 'Contratos activos', value: String(s?.contractsActiveTotal ?? 0) },
        { label: 'Contratos terminados', value: String(s?.contractsCompletedTotal ?? 0) },
        { label: 'Prestes a libertar', value: String(s?.propertiesFutureFree ?? 0) },
        { label: 'Novos clientes', value: String(s?.clientsCount ?? 0) },
        { label: 'Parceiros', value: String(s?.partnersCount ?? 0) },
        { label: 'Agentes', value: String(s?.agentsCount ?? 0) },
        { label: 'Confiança pendente', value: String(s?.trustPending ?? 0) },
        ...(executive
          ? [
              {
                label: 'Ocupação média',
                value: s?.occupancyPct != null ? `${s.occupancyPct}%` : '—',
              },
              {
                label: 'Tempo médio libertação',
                value: s?.avgDaysToFree != null ? `${s.avgDaysToFree}d` : '—',
              },
              { label: 'Receita mensal (demo)', value: formatAoa(s?.monthlyRevenueAoa) },
              { label: 'Receita anual (demo)', value: formatAoa(s?.annualRevenueAoa) },
            ]
          : []),
      ]}
      links={[
        { href: '/app/admin', label: 'Administração', primary: true },
        { href: '/app/admin/utilizadores', label: 'Utilizadores' },
        { href: '/app/financeiro', label: 'Financeiro' },
        { href: '/app/juridico', label: 'Jurídico' },
        { href: '/app/servicos', label: 'Prestadores' },
        { href: '/app/confianca/revisao', label: 'Aprovações' },
      ]}
    />
  );
}

export function FutureAvailabilityList({ s }: { s: OpsStats | null }) {
  if (!s?.futureProperties.length) return null;
  return (
    <section className="kuteka-detail-panel p-5" aria-label="Disponibilidade futura">
      <p className="kuteka-detail-eyebrow">Marketplace · Futuro</p>
      <h2 className="kuteka-detail-title mt-1">Disponibilidade futura</h2>
      <p className="kuteka-detail-body mt-1">
        Imóveis que a Kuteka prevê libertar — active notificações e prepare campanhas.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {s.futureProperties.map((prop) => (
          <li key={prop.id} className="kuteka-ops-block">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="kuteka-ops-block__title">{prop.title ?? 'Património'}</p>
                <p className="kuteka-ops-block__meta">
                  {prop.code}
                  {prop.city ? ` · ${prop.city}` : ''} · livre em ~{prop.daysUntilFree} dias (
                  {prop.expectedAvailableOn})
                </p>
                {prop.availabilityNote ? (
                  <p className="kuteka-ops-block__meta mt-1">{prop.availabilityNote}</p>
                ) : null}
              </div>
              <Link
                href={`/app/habitacao/detalhe?id=${prop.id}`}
                className="text-sm font-bold text-[#08263f] underline-offset-2 hover:underline"
              >
                Ver / notificar
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
