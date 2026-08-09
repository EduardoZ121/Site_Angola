'use client';

import Link from 'next/link';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getOpsCopy } from '../content';
import { formatAoa, formatDays } from '../format';
import type { OpsStats } from '../types';
import { OpsCockpitShell } from './OpsCockpitShell';

export function ClientOpsCockpit({ s, loading }: { s: OpsStats | null; loading: boolean }) {
  const { locale } = useLocale();
  const c = getOpsCopy(locale).client;
  const active = s?.clientContracts.find((row) => row.status === 'active');
  return (
    <OpsCockpitShell
      loading={loading}
      eyebrow={c.eyebrow}
      title={c.title}
      subtitle={c.subtitle}
      stats={[
        { label: c.daysRemaining, value: formatDays(active?.daysRemaining, locale) },
        {
          label: c.nextRent,
          value:
            active?.nextPaymentAmountAoa != null ? formatAoa(active.nextPaymentAmountAoa) : '—',
        },
        { label: c.paymentsPaid, value: String(s?.paymentsPaid ?? 0) },
        { label: c.late, value: String(s?.paymentsLate ?? 0) },
        { label: c.maintenanceOpen, value: String(s?.maintenanceOpen ?? 0) },
        { label: c.interests, value: String(s?.interests ?? 0) },
        { label: c.deposit, value: formatAoa(active?.depositAoa) },
        {
          label: c.contractStatus,
          value: active?.status ?? c.noActiveContract,
        },
      ]}
      links={[
        { href: '/app/habitacao?vista=residencia', label: c.linkResidence, primary: true },
        { href: '/app/contratos', label: c.linkContracts },
        { href: '/app/habitacao/explorar?disponibilidade=futura', label: c.linkFuture },
        { href: '/app/habitacao/explorar', label: c.linkExplore },
      ]}
    >
      {active ? (
        <div className="kuteka-ops-block mt-4">
          <p className="kuteka-ops-block__title">{active.propertyTitle ?? c.currentProperty}</p>
          <p className="kuteka-ops-block__meta">
            {active.propertyCode} · {active.startsOn ?? '—'} → {active.endsOn ?? '—'}
            {active.exitIntent !== 'none'
              ? ` · ${c.exitLabel}: ${active.exitIntent}${active.exitIntentDate ? ` (${active.exitIntentDate})` : ''}`
              : ''}
          </p>
          <p className="kuteka-ops-block__meta mt-1">
            {c.calendarHint.replace('{due}', active.nextPaymentDue ?? '—')}
          </p>
        </div>
      ) : (
        <p className="kuteka-detail-meta mt-4">{c.empty}</p>
      )}
    </OpsCockpitShell>
  );
}

export function PartnerOpsCockpit({ s, loading }: { s: OpsStats | null; loading: boolean }) {
  const { locale } = useLocale();
  const c = getOpsCopy(locale).partner;
  const soon = s?.futureProperties[0];
  return (
    <OpsCockpitShell
      loading={loading}
      eyebrow={c.eyebrow}
      title={c.title}
      subtitle={c.subtitle}
      stats={[
        { label: c.monthlyRevenue, value: formatAoa(s?.monthlyRevenueAoa) },
        { label: c.annualRevenue, value: formatAoa(s?.annualRevenueAoa) },
        { label: c.occupancy, value: s?.occupancyPct != null ? `${s.occupancyPct}%` : '—' },
        { label: c.occupied, value: String(s?.propertiesOccupied ?? 0) },
        { label: c.available, value: String(s?.propertiesAvailable ?? 0) },
        { label: c.soonFree, value: String(s?.propertiesFutureFree ?? 0) },
        { label: c.activeContracts, value: String(s?.partnerContractsActive ?? 0) },
        { label: c.expiring, value: String(s?.partnerContractsExpiring ?? 0) },
        { label: c.interested, value: String(s?.pipelineInterests ?? 0) },
        { label: c.visits30, value: String(s?.pipelineVisits30 ?? 0) },
        { label: c.proposals30, value: String(s?.pipelineProposals30 ?? 0) },
        {
          label: c.rating,
          value: s?.reviewAvg != null ? `${s.reviewAvg.toFixed(1)}★` : '—',
        },
      ]}
      links={[
        { href: '/app/patrimonios', label: c.linkProperties, primary: true },
        { href: '/app/contratos', label: c.linkContracts },
        { href: '/app/habitacao/explorar?disponibilidade=futura', label: c.linkReleases },
        { href: '/app/confianca', label: c.linkTrust },
      ]}
    >
      <div className="kuteka-ops-pipeline mt-4">
        <p className="kuteka-ops-block__title">{c.pipelineTitle}</p>
        <p className="kuteka-ops-pipeline__flow">{c.pipelineFlow}</p>
        {soon ? (
          <p className="kuteka-ops-block__meta mt-2">
            {c.kaiForecast
              .replace('{title}', soon.title ?? soon.code ?? '—')
              .replace('{days}', String(soon.daysUntilFree))}
            {soon.availabilityNote ? ` — ${soon.availabilityNote}` : ''}.
          </p>
        ) : null}
      </div>
    </OpsCockpitShell>
  );
}

export function AgentOpsCockpit({ s, loading }: { s: OpsStats | null; loading: boolean }) {
  const { locale } = useLocale();
  const c = getOpsCopy(locale).agent;
  return (
    <OpsCockpitShell
      loading={loading}
      eyebrow={c.eyebrow}
      title={c.title}
      subtitle={c.subtitle}
      stats={[
        { label: c.assigned, value: String(s?.assignments ?? 0) },
        { label: c.contracts, value: String(s?.agentContracts ?? 0) },
        { label: c.futureReleases, value: String(s?.propertiesFutureFree ?? 0) },
        { label: c.networkInterests, value: String(s?.pipelineInterests ?? 0) },
        { label: c.visits30, value: String(s?.pipelineVisits30 ?? 0) },
        { label: c.proposals30, value: String(s?.pipelineProposals30 ?? 0) },
      ]}
      links={[
        { href: '/app/agente', label: c.linkCrm, primary: true },
        { href: '/app/agente/explorar', label: c.linkInventory },
        { href: '/app/contratos', label: c.linkSignatures },
        { href: '/app/habitacao/explorar?disponibilidade=futura', label: c.linkUrgent },
      ]}
    />
  );
}

export function SupervisorOpsCockpit({ s, loading }: { s: OpsStats | null; loading: boolean }) {
  return (
    <OpsCockpitShell
      loading={loading}
      eyebrow="Supervisor · Operação diária"
      title="Cockpit do Supervisor"
      subtitle="Processos atribuídos, análise de patrimónios, pendências, SLA, contacto PP e escalação."
      stats={[
        { label: 'Confiança pendente', value: String(s?.trustPending ?? 0) },
        { label: 'Parceiros', value: String(s?.partnersCount ?? 0) },
        { label: 'Agentes', value: String(s?.agentsCount ?? 0) },
        { label: 'Contratos activos', value: String(s?.contractsActiveTotal ?? 0) },
        { label: 'Libertações futuras', value: String(s?.propertiesFutureFree ?? 0) },
        { label: 'Interessados (rede)', value: String(s?.pipelineInterests ?? 0) },
      ]}
      links={[
        { href: '/app/admin', label: 'Central de Trabalho', primary: true },
        { href: '/app/admin#escalacoes', label: 'Escalações' },
        { href: '/app/mensagens', label: 'Contactar PP' },
        { href: '/app/admin/utilizadores', label: 'Atribuir Agentes' },
        { href: '/app/confianca/revisao', label: 'Confiança' },
        { href: '/app/agente', label: 'Área Agente' },
      ]}
    >
      <div className="kuteka-ops-pipeline mt-4">
        <p className="kuteka-ops-block__title">Fluxo do dia</p>
        <p className="kuteka-ops-pipeline__flow">
          Fila → Análise → Pendência / SLA → Contactar PP → Atribuir Agente → Escalar (Admin)
        </p>
        <p className="kuteka-ops-block__meta mt-2">
          Não aprova nem rejeita definitivamente — escala para Admin com motivo e prazo.
        </p>
      </div>
    </OpsCockpitShell>
  );
}

export function FounderOpsCockpit({ s, loading }: { s: OpsStats | null; loading: boolean }) {
  return (
    <OpsCockpitShell
      loading={loading}
      eyebrow="Founder / Owner"
      title="Founder Center · visão executiva"
      subtitle="Governação, pessoas institucionais, flags, KOCC, auditoria e escalações no topo."
      stats={[
        { label: 'Utilizadores', value: String(s?.users ?? 0) },
        { label: 'Parceiros', value: String(s?.partnersCount ?? 0) },
        { label: 'Agentes', value: String(s?.agentsCount ?? 0) },
        { label: 'Contratos activos', value: String(s?.contractsActiveTotal ?? 0) },
        {
          label: 'Ocupação',
          value: s?.occupancyPct != null ? `${s.occupancyPct}%` : '—',
        },
        { label: 'Receita mensal', value: formatAoa(s?.monthlyRevenueAoa) },
      ]}
      links={[
        { href: '/app/fundador', label: 'Founder Center', primary: true },
        { href: '/app/fundador?tab=pessoas', label: 'Gestão Institucional' },
        { href: '/app/fundador?tab=flags', label: 'Feature Flags' },
        { href: '/app/fundador?tab=kocc', label: 'KOCC' },
        { href: '/app/fundador?tab=escalacoes', label: 'Escalações' },
        { href: '/app/super', label: 'Super Command' },
      ]}
    >
      <div className="kuteka-ops-pipeline mt-4">
        <p className="kuteka-ops-block__title">Hierarquia</p>
        <p className="kuteka-ops-pipeline__flow">Supervisor → Admin → Super Admin → Founder</p>
      </div>
    </OpsCockpitShell>
  );
}

export function ProviderOpsCockpit({ s, loading }: { s: OpsStats | null; loading: boolean }) {
  return (
    <OpsCockpitShell
      loading={loading}
      eyebrow="Prestador · Serviços"
      title="Fluxo mínimo operacional"
      subtitle="Pedido → Orçamento → Aceite → Serviço → Agenda → Evidências → Conclusão → Pagamento → Avaliação."
      stats={[
        { label: 'Manutenções abertas (rede)', value: String(s?.maintenanceOpen ?? 0) },
        { label: 'Contratos activos', value: String(s?.contractsActiveTotal ?? 0) },
        { label: 'Confiança pendente', value: String(s?.trustPending ?? 0) },
      ]}
      links={[
        { href: '/app/servicos', label: 'Inbox de serviços', primary: true },
        { href: '/app/financeiro', label: 'Pagamentos' },
        { href: '/app/centro-confianca', label: 'Confiança' },
        { href: '/app/mensagens', label: 'Mensagens' },
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
  const { locale } = useLocale();
  const c = getOpsCopy(locale).admin;
  return (
    <OpsCockpitShell
      loading={loading}
      eyebrow={executive ? c.eyebrowExec : c.eyebrow}
      title={executive ? c.titleExec : c.title}
      subtitle={executive ? c.subtitleExec : c.subtitle}
      stats={[
        { label: c.users, value: String(s?.users ?? 0) },
        { label: c.contractsActive, value: String(s?.contractsActiveTotal ?? 0) },
        { label: c.contractsCompleted, value: String(s?.contractsCompletedTotal ?? 0) },
        { label: c.soonFree, value: String(s?.propertiesFutureFree ?? 0) },
        { label: c.newClients, value: String(s?.clientsCount ?? 0) },
        { label: c.partners, value: String(s?.partnersCount ?? 0) },
        { label: c.agents, value: String(s?.agentsCount ?? 0) },
        { label: c.trustPending, value: String(s?.trustPending ?? 0) },
        ...(executive
          ? [
              {
                label: c.avgOccupancy,
                value: s?.occupancyPct != null ? `${s.occupancyPct}%` : '—',
              },
              {
                label: c.avgRelease,
                value: s?.avgDaysToFree != null ? `${s.avgDaysToFree}d` : '—',
              },
              { label: c.monthlyRevenue, value: formatAoa(s?.monthlyRevenueAoa) },
              { label: c.annualRevenue, value: formatAoa(s?.annualRevenueAoa) },
            ]
          : []),
      ]}
      links={[
        { href: '/app/admin', label: c.linkAdmin, primary: true },
        { href: '/app/admin/utilizadores', label: c.linkUsers },
        { href: '/app/financeiro', label: c.linkFinance },
        { href: '/app/juridico', label: c.linkLegal },
        { href: '/app/servicos', label: c.linkProviders },
        { href: '/app/confianca/revisao', label: c.linkApprovals },
      ]}
    />
  );
}

export function FutureAvailabilityList({ s }: { s: OpsStats | null }) {
  const { locale } = useLocale();
  const c = getOpsCopy(locale).future;
  if (!s?.futureProperties.length) return null;
  return (
    <section className="kuteka-detail-panel p-5" aria-label={c.aria}>
      <p className="kuteka-detail-eyebrow">{c.eyebrow}</p>
      <h2 className="kuteka-detail-title mt-1">{c.title}</h2>
      <p className="kuteka-detail-body mt-1">{c.subtitle}</p>
      <ul className="mt-4 flex flex-col gap-3">
        {s.futureProperties.map((prop) => (
          <li key={prop.id} className="kuteka-ops-block">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="kuteka-ops-block__title">{prop.title ?? c.propertyFallback}</p>
                <p className="kuteka-ops-block__meta">
                  {prop.code}
                  {prop.city ? ` · ${prop.city}` : ''} ·{' '}
                  {c.freeIn.replace('{days}', String(prop.daysUntilFree))} (
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
                {c.viewNotify}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
