import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { HelpTip } from '../components/ui/HelpTip'
import { PageIntro, SectionBlock } from '../components/SectionBlock'
import { OwnerAlertList } from '../components/owner/OwnerAlertList'
import { OwnerCrossNav } from '../components/owner/OwnerCrossNav'
import { OwnerEmptyState } from '../components/owner/OwnerEmptyState'
import { OwnerInsightsBar } from '../components/owner/OwnerInsightsBar'
import { OwnerListingCard } from '../components/owner/OwnerListingCard'
import { OwnerStatsCards } from '../components/owner/OwnerStatsCards'
import { computeOwnerInsights } from '../utils/ownerDashboard'
import { computeOwnerStats, getOwnerFirstName } from '../utils/ownerListing'
import '../styles/owner-dashboard.css'

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'Ativo', label: 'Publicados' },
  { id: 'Pendente', label: 'Em revisão' },
  { id: 'Pausado', label: 'Pausados' },
  { id: 'Rejeitado', label: 'Rejeitados' },
]

export default function OwnerDashboardPage() {
  const {
    profile,
    favorites,
    chatByListing,
    getMyListings,
    getMyNotifications,
    markNotificationRead,
    duplicateListing,
    pauseListing,
    activateListing,
    archiveListing,
    renewFeatured,
    deleteListing,
  } = useMarketplace()

  const [filter, setFilter] = useState('all')

  useEffect(() => {
    document.title = 'Painel | Kuteka'
  }, [])

  const myListings = getMyListings()
  const notifications = getMyNotifications()
  const recentAlerts = notifications.slice(0, 4)
  const unreadCount = notifications.filter((item) => !item.read).length

  const stats = useMemo(
    () => computeOwnerStats(myListings, favorites, chatByListing),
    [myListings, favorites, chatByListing],
  )

  const insights = useMemo(() => computeOwnerInsights(myListings, stats), [myListings, stats])

  const filterCounts = useMemo(
    () => ({
      all: myListings.length,
      Ativo: myListings.filter((item) => item.status === 'Ativo').length,
      Pendente: myListings.filter((item) => item.status === 'Pendente').length,
      Pausado: myListings.filter((item) => item.status === 'Pausado').length,
      Rejeitado: myListings.filter((item) => item.status === 'Rejeitado').length,
    }),
    [myListings],
  )

  const filtered = useMemo(() => {
    if (filter === 'all') return myListings
    return myListings.filter((listing) => listing.status === filter)
  }, [filter, myListings])

  const firstName = getOwnerFirstName(profile)

  return (
    <main className="page-main owner-dashboard-page">
      <PageIntro
        eyebrow="Painel do proprietário"
        title={`Olá, ${firstName}`}
        subtitle="Gerir anúncios, acompanhar estatísticas e responder aos compradores."
      />

      <div className="owner-dashboard-shell section-block-inner">
        <CatalogBreadcrumbs
          items={[
            { label: 'Início', to: '/inicio' },
            { label: 'Painel', to: '/painel' },
          ]}
        />

        <p className="owner-help-line">
          Publique, edite ou pause anúncios — as alterações guardam-se no seu dispositivo (demo).
          <HelpTip
            label="Ajuda: painel"
            text="Anúncios novos passam por revisão. Rejeitados podem ser corrigidos e reenviados. Pausados deixam de aparecer no catálogo."
          />
        </p>

        <div className="owner-quick-links panel-card">
          <Link className="button primary" to="/publicar">
            + Publicar anúncio
          </Link>
          <Link className="button filter-button" to="/conta">
            Minha conta
          </Link>
          <Link className="button filter-button" to="/destaques">
            Planos destaque
          </Link>
        </div>

        <OwnerInsightsBar items={insights} onFilter={setFilter} />

        <SectionBlock eyebrow="Resumo" title="Os seus números" tone="light">
          <OwnerStatsCards stats={stats} />
        </SectionBlock>

        {recentAlerts.length ? (
          <SectionBlock
            eyebrow="Alertas"
            title="Notificações recentes"
            subtitle={unreadCount ? `${unreadCount} por ler` : 'Tudo em dia'}
            tone="muted"
          >
            <OwnerAlertList alerts={recentAlerts} onMarkRead={markNotificationRead} />
            <Link className="text-button" to="/conta#mensagens">
              Ver todas na conta
            </Link>
          </SectionBlock>
        ) : null}

        <SectionBlock
          id="anuncios"
          eyebrow="Gestão"
          title="Os meus anúncios"
          subtitle="Edite, pause, duplique ou destaque — acções sempre visíveis."
          tone="light"
          action={
            <Link className="button filter-button" to="/publicar">
              Novo anúncio
            </Link>
          }
        >
          {myListings.length ? (
            <div className="owner-filter-row" role="tablist" aria-label="Filtrar anúncios">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.id}
                  className={`owner-filter-pill ${filter === item.id ? 'active' : ''}`}
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                  <span className="owner-filter-count">{filterCounts[item.id] ?? 0}</span>
                </button>
              ))}
            </div>
          ) : null}

          {myListings.length === 0 ? (
            <OwnerEmptyState />
          ) : filtered.length === 0 ? (
            <OwnerEmptyState filtered onClearFilter={() => setFilter('all')} />
          ) : (
            <div className="owner-listings-grid">
              {filtered.map((listing) => (
                <OwnerListingCard
                  key={listing.id}
                  listing={listing}
                  favoriteCount={favorites.includes(listing.id) ? 1 : 0}
                  messageCount={(chatByListing[listing.id] || []).length}
                  onDuplicate={duplicateListing}
                  onPause={pauseListing}
                  onActivate={activateListing}
                  onArchive={archiveListing}
                  onRenewFeatured={renewFeatured}
                  onDelete={deleteListing}
                />
              ))}
            </div>
          )}
        </SectionBlock>

        <OwnerCrossNav />
      </div>
    </main>
  )
}
