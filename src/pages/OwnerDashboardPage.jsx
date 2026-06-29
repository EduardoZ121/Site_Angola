import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { OwnerStatsCards } from '../components/owner/OwnerStatsCards'
import { OwnerListingCard } from '../components/owner/OwnerListingCard'
import { EmptyState } from '../components/ui/EmptyState'
import { computeOwnerStats } from '../utils/ownerListing'
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
    getMyListings,
    favorites,
    duplicateListing,
    pauseListing,
    activateListing,
    archiveListing,
    renewFeatured,
    deleteListing,
  } = useMarketplace()
  const [filter, setFilter] = useState('all')

  const myListings = getMyListings()
  const stats = useMemo(() => computeOwnerStats(myListings, favorites), [myListings, favorites])

  const filtered = useMemo(() => {
    if (filter === 'all') return myListings
    return myListings.filter((listing) => listing.status === filter)
  }, [filter, myListings])

  function favoriteCount(listingId) {
    return favorites.includes(listingId) ? 1 : 0
  }

  return (
    <main className="page-main owner-dashboard">
      <header className="owner-dashboard-header">
        <div>
          <p className="eyebrow">Painel do proprietário</p>
          <h1>Os meus anúncios</h1>
          <p>Gerir publicações, estatísticas, destaques e estado de cada anúncio.</p>
        </div>
        <Link className="button primary" to="/publicar">
          + Novo anúncio
        </Link>
      </header>

      <OwnerStatsCards stats={stats} />

      <div className="owner-filter-row">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`owner-filter-pill ${filter === item.id ? 'active' : ''}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={filter === 'all' ? 'Ainda não tem anúncios' : 'Nenhum anúncio neste filtro'}
          description="Publique o primeiro anúncio ou altere o filtro."
          actionLabel="Publicar anúncio"
          actionTo="/publicar"
        />
      ) : (
        <div className="owner-listings-grid">
          {filtered.map((listing) => (
            <OwnerListingCard
              key={listing.id}
              listing={listing}
              favoriteCount={favoriteCount(listing.id)}
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
    </main>
  )
}
