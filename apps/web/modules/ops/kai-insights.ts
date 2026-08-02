import { formatAoa, formatDays } from './format';
import type { ExperienceMode } from '@/modules/shell/role-experience';
import type { KaiInsight, OpsStats } from './types';

/** Rule-based KAI — proactive insights without external ML. */
export function buildKaiInsights(mode: ExperienceMode, stats: OpsStats): KaiInsight[] {
  const insights: KaiInsight[] = [];

  if (mode === 'client' || mode === 'client_partner') {
    const active = stats.clientContracts.find((c) => c.status === 'active');
    if (active?.daysRemaining != null) {
      insights.push({
        id: 'c-days',
        tone: 'predict',
        title: `Contrato com ${formatDays(active.daysRemaining)} restantes`,
        body: active.propertyTitle
          ? `${active.propertyTitle} — prepare renovação ou intenção de saída com antecedência.`
          : 'Acompanhe o calendário do contrato no cockpit.',
        href: '/app/contratos',
      });
    }
    if (active?.daysUntilPayment != null) {
      insights.push({
        id: 'c-pay',
        tone: active.lateDays > 0 ? 'warn' : 'info',
        title:
          active.lateDays > 0
            ? `Pagamento em atraso (${active.lateDays}d)`
            : `Próxima renda em ${formatDays(active.daysUntilPayment)}`,
        body: `Valor previsto: ${formatAoa(active.nextPaymentAmountAoa)}.`,
        href: '/app/contratos',
      });
    }
    if (active && active.exitIntent === 'none' && (active.daysRemaining ?? 999) <= 90) {
      insights.push({
        id: 'c-exit',
        tone: 'info',
        title: 'Considere informar intenção de saída',
        body: '30, 60 ou 90 dias de antecedência ajudam a libertar a caução e a reduzir vazio do imóvel.',
        href: '/app/habitacao?vista=residencia',
      });
    }
    if (stats.maintenanceOpen > 0) {
      insights.push({
        id: 'c-maint',
        tone: 'warn',
        title: `${stats.maintenanceOpen} pedido(s) de serviço em aberto`,
        body: 'Acompanhe manutenção, limpeza ou remodelação no hub de habitação.',
        href: '/app/habitacao?vista=residencia',
      });
    }
  }

  if (mode === 'patrimonial_partner' || mode === 'client_partner') {
    const soon = stats.futureProperties[0];
    if (soon) {
      insights.push({
        id: 'p-free',
        tone: 'predict',
        title: `Imóvel livre em ~${soon.daysUntilFree} dias`,
        body: `${soon.title ?? soon.code ?? 'Património'} — a Kuteka pode iniciar o pipeline comercial agora.`,
        href: `/app/patrimonios/detalhe?id=${soon.id}`,
      });
    }
    if (stats.occupancyPct != null) {
      insights.push({
        id: 'p-occ',
        tone: stats.occupancyPct < 70 ? 'warn' : 'success',
        title: `Ocupação ${stats.occupancyPct}%`,
        body: `${stats.propertiesOccupied} ocupados · ${stats.propertiesAvailable} disponíveis · receita mensal ${formatAoa(stats.monthlyRevenueAoa)}.`,
        href: '/app/patrimonios',
      });
    }
    if (stats.partnerContractsExpiring > 0) {
      insights.push({
        id: 'p-exp',
        tone: 'warn',
        title: `${stats.partnerContractsExpiring} contrato(s) a vencer em 60 dias`,
        body: 'Probabilidade de renovação tipicamente alta quando o acompanhamento começa cedo.',
        href: '/app/contratos',
      });
    }
    if (stats.pipelineInterests > 0) {
      insights.push({
        id: 'p-pipe',
        tone: 'info',
        title: `${stats.pipelineInterests} interessados no pipeline`,
        body: `Visitas 30d: ${stats.pipelineVisits30} · Propostas 30d: ${stats.pipelineProposals30}.`,
        href: '/app/patrimonios',
      });
    }
    if (stats.monthlyRevenueAoa > 0) {
      insights.push({
        id: 'p-rent',
        tone: 'predict',
        title: 'Ajuste de renda sugerido (+6%)',
        body: `Com base na procura actual, a receita mensal poderia aproximar-se de ${formatAoa(stats.monthlyRevenueAoa * 1.06)}.`,
        href: '/app/patrimonios',
      });
    }
  }

  if (mode === 'certified_agent') {
    insights.push({
      id: 'a-crm',
      tone: 'info',
      title: `${stats.assignments} imóveis no pipeline`,
      body: `${stats.agentContracts} contratos ligados · priorize visitas e avaliações pendentes.`,
      href: '/app/agente',
    });
    if (stats.futureProperties.length) {
      insights.push({
        id: 'a-fut',
        tone: 'predict',
        title: `${stats.futureProperties.length} imóveis com disponibilidade futura`,
        body: 'Contacte clientes compatíveis da zona antes da libertação.',
        href: '/app/habitacao/explorar?disponibilidade=futura',
      });
    }
  }

  if (mode === 'administrator' || mode === 'super_administrator') {
    insights.push({
      id: 'ad-ops',
      tone: 'info',
      title: `${stats.contractsActiveTotal} contratos activos`,
      body: `${stats.contractsCompletedTotal} concluídos · ${stats.trustPending} aprovações de confiança pendentes.`,
      href: '/app/admin',
    });
    if (stats.propertiesFutureFree > 0) {
      insights.push({
        id: 'ad-free',
        tone: 'predict',
        title: `${stats.propertiesFutureFree} imóveis prestes a libertar`,
        body: `Tempo médio até disponibilidade: ~${stats.avgDaysToFree ?? '—'} dias.`,
        href: '/app/habitacao/explorar?disponibilidade=futura',
      });
    }
    if (mode === 'super_administrator') {
      insights.push({
        id: 's-exec',
        tone: 'success',
        title: 'Cockpit executivo',
        body: `Clientes ${stats.clientsCount} · Parceiros ${stats.partnersCount} · Agentes ${stats.agentsCount} · Ocupação média ${stats.occupancyPct ?? '—'}%.`,
        href: '/app/admin',
      });
    }
  }

  return insights.slice(0, 5);
}
