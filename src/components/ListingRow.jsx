import { Link } from 'react-router-dom'
import { defaultPhoto } from '../data/constants'
import { formatKz } from '../utils/format'
import { TrustBadge } from './ui'

export function ListingRow({ listing }) {
  return (
    <article className="listing-row">
      <Link className="listing-row-media" to={`/anuncio/${listing.id}`}>
        <img src={listing.photos?.[0] || defaultPhoto} alt={listing.title} loading="lazy" />
      </Link>
      <div className="listing-row-body">
        <div className="listing-meta">
          <span>{listing.category}</span>
          <span>{listing.operation}</span>
          {listing.featured ? <span className="listing-tag">Destaque</span> : null}
          <TrustBadge listing={listing} />
        </div>
        <h3>
          <Link to={`/anuncio/${listing.id}`}>{listing.title}</Link>
        </h3>
        <p>
          {listing.province} / {listing.municipality} / {listing.neighborhood}
        </p>
        <strong>{formatKz(listing.price)}</strong>
        <Link className="button primary compact" to={`/anuncio/${listing.id}`}>
          Ver detalhes
        </Link>
      </div>
    </article>
  )
}
