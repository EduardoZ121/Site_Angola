import { Link } from 'react-router-dom'
import { defaultPhoto } from '../../data/constants'
import { formatKz } from '../../utils/format'

function formatSimilarPrice(listing) {
  const price = formatKz(listing.price)
  return listing.operation === 'Arrendamento' ? `${price}/mês` : price
}

export function SimilarListings({ listings, seeAllLink }) {
  if (!listings.length) return null

  return (
    <section className="listing-similar-compact">
      <div className="listing-similar-head">
        <h2>Anúncios semelhantes</h2>
        {seeAllLink ? (
          <Link className="text-button" to={seeAllLink}>
            Ver todos
          </Link>
        ) : null}
      </div>
      <div className="listing-similar-scroll">
        {listings.map((listing) => (
          <Link key={listing.id} className="listing-similar-mini" to={`/anuncio/${listing.id}`}>
            <img src={listing.photos?.[0] || defaultPhoto} alt="" loading="lazy" />
            <div>
              <strong>{listing.title}</strong>
              <span>{formatSimilarPrice(listing)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
