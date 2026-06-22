import { Link } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { ListingCard } from '../components/ListingCard'
import { PageIntro, SectionBlock } from '../components/SectionBlock'

export default function FavoritesPage() {
  const { listings, favorites, compare, toggleFavorite, toggleCompare } = useMarketplace()
  const items = favorites
    .map((id) => listings.find((listing) => listing.id === id))
    .filter(Boolean)

  return (
    <main className="page-main">
      <PageIntro
        eyebrow="Favoritos"
        title="Os meus anúncios guardados"
        subtitle="Página separada — guarde imóveis e veículos para ver depois."
      />

      <SectionBlock
        id="lista-favoritos"
        eyebrow="Guardados"
        title={`${items.length} favorito${items.length === 1 ? '' : 's'}`}
        action={
          <Link className="text-button" to="/comprar">
            Explorar anúncios
          </Link>
        }
      >
        {items.length === 0 ? (
          <div className="empty-state panel-card">
            <p>Ainda não guardou favoritos.</p>
            <Link className="button primary" to="/comprar">
              Ver imóveis
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
      </SectionBlock>
    </main>
  )
}
