import { Link } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { ListingCard } from '../components/ListingCard'

export default function FavoritesPage() {
  const { listings, favorites, compare, toggleFavorite, toggleCompare } = useMarketplace()
  const items = favorites
    .map((id) => listings.find((listing) => listing.id === id))
    .filter(Boolean)

  return (
    <main className="page-main">
      <section className="page-hero compact">
        <div className="page-hero-inner">
          <p className="eyebrow">Favoritos</p>
          <h1>Os meus anúncios guardados</h1>
        </div>
      </section>

      <section className="section page-section">
        {items.length === 0 ? (
          <div className="empty-state panel-card">
            <p>Ainda não guardou favoritos.</p>
            <Link className="button primary" to="/comprar">
              Explorar anúncios
            </Link>
          </div>
        ) : (
          <div className="listing-grid">
            {items.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                favorites={favorites}
                compareIds={compare}
                onFavorite={toggleFavorite}
                onCompare={toggleCompare}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
