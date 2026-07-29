import { useEffect, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { PendingListingsPanel } from '../components/staff/PendingListingsPanel'
import { AgentVisitsPanel } from '../components/staff/AgentVisitsPanel'
import { AgentAccessDenied } from '../components/agent/AgentAccessDenied'
import { AgentAlertsFeed } from '../components/agent/AgentAlertsFeed'
import { AgentCrossNav } from '../components/agent/AgentCrossNav'
import { AgentInquiryList } from '../components/agent/AgentInquiryList'
import { AgentInsightsBar } from '../components/agent/AgentInsightsBar'
import { AgentQuickNav } from '../components/agent/AgentQuickNav'
import { AgentStatsCards } from '../components/agent/AgentStatsCards'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { HelpTip } from '../components/ui/HelpTip'
import { useMarketplace } from '../context/MarketplaceContext'
import { isListingPending } from '../constants/staff'
import { PageIntro, SectionBlock } from '../components/SectionBlock'
import { computeAgentInsights, computeAgentStats } from '../utils/agent'
import '../styles/agent.css'

export default function AgentPage() {
  const {
    listings,
    chatByListing,
    notifications,
    isAgent,
    isAdmin,
    isLoggedIn,
    profile,
    approveListing,
    rejectListing,
    scheduleVisit,
    cancelVisit,
    completeVisit,
    getAgentVisits,
  } = useMarketplace()

  const agentVisits = getAgentVisits()
  const pendingListings = listings.filter((listing) => isListingPending(listing))
  const staffAlerts = notifications.filter((item) => item.audience === 'staff').slice(0, 8)

  const inquiryThreads = useMemo(
    () =>
      Object.entries(chatByListing)
        .map(([listingId, messages]) => {
          const listing = listings.find((item) => item.id === listingId)
          const last = messages[messages.length - 1]
          return { listingId, listing, messages, last }
        })
        .filter((thread) => thread.last)
        .sort((a, b) => new Date(b.last?.at || 0) - new Date(a.last?.at || 0)),
    [chatByListing, listings],
  )

  const stats = useMemo(
    () => computeAgentStats(pendingListings, inquiryThreads, agentVisits, staffAlerts),
    [pendingListings, inquiryThreads, agentVisits, staffAlerts],
  )

  const insights = useMemo(() => computeAgentInsights(stats), [stats])

  useEffect(() => {
    document.title = isAgent || isAdmin ? 'Painel agente | Kuteka' : 'Agente — acesso | Kuteka'
    const hash = window.location.hash
    if (!hash) return
    const target = document.querySelector(hash)
    if (target) {
      window.setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }
  }, [isAgent, isAdmin])

  if (!isLoggedIn) {
    return <Navigate to="/entrar?redirect=%2Fagente" replace />
  }

  if (!isAgent && !isAdmin) {
    return (
      <main className="page-main agent-page">
        <PageIntro eyebrow="Equipa" title="Acesso reservado" subtitle="Área para agentes Kuteka certificados." />
        <div className="agent-page-body section-block-inner">
          <AgentAccessDenied profileEmail={profile.email} />
        </div>
      </main>
    )
  }

  return (
    <main className="page-main agent-page staff-page">
      <PageIntro
        eyebrow="Agente Kuteka"
        title="Painel do agente"
        subtitle={`${profile.email} — aprovar anúncios, responder clientes e planear visitas.`}
      />

      <div className="agent-page-body section-block-inner">
        <CatalogBreadcrumbs
          items={[
            { label: 'Início', to: '/inicio' },
            { label: 'Agente', to: '/agente' },
          ]}
        />

        <p className="agent-help-line">
          Aprove anúncios na fila e agende visitas — o senhorio recebe notificação na conta.
          <HelpTip
            label="Ajuda: agente"
            text="Agentes aprovados moderam anúncios e acompanham compradores. Tudo é demo local neste dispositivo."
          />
        </p>

        <AgentQuickNav showAlerts={staffAlerts.length > 0} />
        <AgentInsightsBar items={insights} />

        <SectionBlock id="resumo" eyebrow="Resumo" title="Os seus números" tone="light">
          <AgentStatsCards stats={stats} />
        </SectionBlock>

        <SectionBlock id="fila" eyebrow="Prioridade" title={`Anúncios pendentes (${pendingListings.length})`}>
          <PendingListingsPanel
            pendingListings={pendingListings}
            onApprove={approveListing}
            onReject={rejectListing}
            emptyMessage="Nenhum anúncio aguarda aprovação."
          />
        </SectionBlock>

        <SectionBlock
          id="mensagens"
          eyebrow="Clientes"
          title="Mensagens e contactos"
          subtitle="Conversas iniciadas na página do anúncio — responda por telefone."
          tone="muted"
        >
          <AgentInquiryList threads={inquiryThreads} />
        </SectionBlock>

        <SectionBlock
          id="visitas"
          eyebrow="Operações"
          title="Visitas ao local"
          subtitle="Agenda abre no Google Calendar. O senhorio recebe notificação na conta Kuteka."
        >
          <AgentVisitsPanel
            listings={listings}
            profile={profile}
            visits={agentVisits}
            onSchedule={scheduleVisit}
            onCancel={cancelVisit}
            onComplete={completeVisit}
          />
        </SectionBlock>

        {staffAlerts.length ? (
          <SectionBlock id="alertas" eyebrow="Actividade" title="Alertas recentes" tone="muted">
            <AgentAlertsFeed alerts={staffAlerts} />
          </SectionBlock>
        ) : null}

        <AgentCrossNav />
      </div>
    </main>
  )
}
