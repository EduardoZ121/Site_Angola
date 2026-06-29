import { ListingCard } from '../ListingCard'

export function SimilarListings({ listings, favorites, compare, onFavorite, onCompare }) {
  if (!listings.length) return null
  return (
    <section className="listing-similar">
      <h2>Anúncios semelhantes</h2>
      <div className="listing-grid">
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            favorites={favorites}
            compareIds={compare}
            onFavorite={onFavorite}
            onCompare={onCompare}
          />
        ))}
      </div>
    </section>
  )
}
