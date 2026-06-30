import { useEffect, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { PendingListingsPanel } from '../components/staff/PendingListingsPanel'
import { AdminAgentsPanel } from '../components/staff/AdminAgentsPanel'
import { AdminAccessDenied } from '../components/admin/AdminAccessDenied'
import { AdminActivityFeed } from '../components/admin/AdminActivityFeed'
import { AdminCrossNav } from '../components/admin/AdminCrossNav'
import { AdminInsightsBar } from '../components/admin/AdminInsightsBar'
import { AdminModerationList } from '../components/admin/AdminModerationList'
import { AdminQuickNav } from '../components/admin/AdminQuickNav'
import { AdminSiteControl } from '../components/admin/AdminSiteControl'
import { AdminUsersTable } from '../components/admin/AdminUsersTable'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { useMarketplace } from '../context/MarketplaceContext'
import { isListingPending } from '../constants/staff'
import { PageIntro, SectionBlock } from '../components/SectionBlock'
import { computeAdminInsights, computeExtendedAdminStats } from '../utils/admin'
import '../styles/admin.css'

export default function AdminPage() {
  const {
    listings,
    siteUsers,
    notifications,
    isAdmin,
    isLoggedIn,
    profile,
    approveListing,
    rejectListing,
    deleteListing,
    updateListing,
    adminPatchListing,
    refreshAdminCatalog,
    updateSiteSettings,
    clearDemoListingsAdmin,
    restoreDemoListingsAdmin,
    siteSettings,
    apiConnected,
    agentApplications,
    approvedAgents,
    adminCreateAgentCandidate,
    adminSendAgentTest,
    adminApproveAgent,
    adminRejectAgent,
    adminRevokeAgent,
    adminResetAgentTest,
  } = useMarketplace()

  const pendingListings = listings.filter((listing) => isListingPending(listing))
  const otherListings = listings.filter((listing) => !isListingPending(listing))
  const recentNotifications = notifications.slice(0, 12)

  const stats = useMemo(
    () => computeExtendedAdminStats(listings, siteUsers, agentApplications, approvedAgents),
    [listings, siteUsers, agentApplications, approvedAgents],
  )

  const insights = useMemo(() => computeAdminInsights(stats), [stats])

  useEffect(() => {
    document.title = isAdmin ? 'Admin | Kuteka' : 'Admin — acesso | Kuteka'
    if (isAdmin) refreshAdminCatalog()
    const hash = window.location.hash
    if (!hash) return
    const target = document.querySelector(hash)
    if (target) {
      window.setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    }
  }, [isAdmin, refreshAdminCatalog])

  function copyUserEmails() {
    const emails = siteUsers.map((user) => user.email).join(', ')
    if (emails && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(emails)
    }
  }

  function handlePause(listingId) {
    updateListing(listingId, { status: 'Pausado' })
  }

  function handleReactivate(listingId) {
    approveListing(listingId)
  }

  function handleToggleFeatured(listingId, featured) {
    updateListing(listingId, { featured })
  }

  if (!isLoggedIn) {
    return <Navigate to="/entrar?redirect=%2Fadmin" replace />
  }

  if (!isAdmin) {
    return (
      <main className="page-main admin-page">
        <PageIntro
          eyebrow="Admin"
          title="Acesso negado"
          subtitle="Esta área é só para o administrador Kuteka."
        />
        <div className="admin-page-body section-block-inner">
          <AdminAccessDenied profileEmail={profile.email} />
        </div>
      </main>
    )
  }

  return (
    <main className="page-main admin-page staff-page">
      <PageIntro
        eyebrow="Administrador"
        title="Painel Kuteka"
        subtitle={`Sessão: ${profile.email} — moderação, agentes e utilizadores.`}
      />

      <div className="admin-page-body section-block-inner">
        <CatalogBreadcrumbs
          items={[
            { label: 'Início', to: '/inicio' },
            { label: 'Admin', to: '/admin' },
          ]}
        />

        <p className="admin-help-line">
          Aprove anúncios na fila antes de ficarem visíveis no catálogo. Apagar remove na base de dados real.
        </p>

        <SectionBlock id="controlo-site" eyebrow="Site" title="Controlo demo vs real" tone="light">
          <AdminSiteControl
            siteSettings={siteSettings}
            apiConnected={apiConnected}
            onUpdateSettings={updateSiteSettings}
            onClearDemo={clearDemoListingsAdmin}
            onRestoreDemo={restoreDemoListingsAdmin}
            onRefreshCatalog={refreshAdminCatalog}
          />
        </SectionBlock>

        <AdminQuickNav />
        <AdminInsightsBar items={insights} />

        <SectionBlock id="stats" eyebrow="Resumo" title="Números do site" tone="light">
          <AdminStatsCards stats={stats} />
        </SectionBlock>

        <SectionBlock
          id="fila-aprovacao"
          eyebrow="Prioridade"
          title={`Aprovar anúncios (${pendingListings.length})`}
          subtitle="Revise fotos e perfil — rejeite fotos pessoais ou conteúdo inválido."
        >
          <PendingListingsPanel
            pendingListings={pendingListings}
            onApprove={approveListing}
            onReject={rejectListing}
            onDelete={deleteListing}
            canDelete
          />
        </SectionBlock>

        <SectionBlock
          id="agentes"
          eyebrow="Equipa"
          title="Candidatos e agentes"
          subtitle="Convide intermediários, envie o teste de 25 perguntas e active quem passar."
        >
          <AdminAgentsPanel
            siteUsers={siteUsers}
            agentApplications={agentApplications}
            approvedAgents={approvedAgents}
            onCreateCandidate={adminCreateAgentCandidate}
            onSendTest={adminSendAgentTest}
            onApprove={adminApproveAgent}
            onReject={adminRejectAgent}
            onRevoke={adminRevokeAgent}
            onRetest={adminResetAgentTest}
          />
        </SectionBlock>

        <SectionBlock
          id="utilizadores"
          eyebrow="Contas"
          title={`Utilizadores registados (${siteUsers.length})`}
          subtitle="Emails e logins guardados neste browser (demo)."
          tone="muted"
        >
          <AdminUsersTable users={siteUsers} onCopyEmails={copyUserEmails} />
        </SectionBlock>

        <SectionBlock
          id="actividade"
          eyebrow="Actividade"
          title="Últimas notificações"
          subtitle="Pedidos de publicação, aprovações e rejeições."
        >
          <AdminActivityFeed notifications={recentNotifications} />
        </SectionBlock>

        <SectionBlock
          id="moderacao"
          eyebrow="Anúncios"
          title="Moderação geral"
          subtitle="Gerir activos, pausados e rejeitados fora da fila."
          tone="muted"
        >
          <AdminModerationList
            listings={otherListings}
            onPause={handlePause}
            onReactivate={handleReactivate}
            onToggleFeatured={handleToggleFeatured}
            onDelete={deleteListing}
            onAdminPatch={adminPatchListing}
          />
        </SectionBlock>

        <AdminCrossNav />
      </div>
    </main>
  )
}
