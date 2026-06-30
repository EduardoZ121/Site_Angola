import { Link } from 'react-router-dom'
import { defaultPhoto } from '../../data/constants'
import { formatKz } from '../../utils/format'

export function SimilarListings({ listings }) {
  if (!listings.length) return null

  return (
    <section className="listing-similar-compact">
      <h2>Semelhantes</h2>
      <div className="listing-similar-scroll">
        {listings.map((listing) => (
          <Link key={listing.id} className="listing-similar-mini" to={`/anuncio/${listing.id}`}>
            <img src={listing.photos?.[0] || defaultPhoto} alt="" loading="lazy" />
            <div>
              <strong>{listing.title}</strong>
              <span>{formatKz(listing.price)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
