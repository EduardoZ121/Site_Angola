import { Link } from 'react-router-dom'
import { defaultPhoto } from '../data/constants'
import { formatKz, whatsappLink } from '../utils/format'
import { TrustBadge } from './ui'

export function ListingCard({ listing, favorites, onFavorite, onCompare, compareIds }) {
  return (
    <article className="listing-card">
      <Link to={`/anuncio/${listing.id}`} aria-label={`Abrir ${listing.title}`}>
        <img src={listing.photos?.[0] || defaultPhoto} alt={listing.title} />
      </Link>
      <div className="listing-body">
        <div className="listing-meta">
          <span>{listing.category}</span>
          <span>{listing.operation}</span>
          <TrustBadge listing={listing} />
        </div>
        <h3>
          <Link to={`/anuncio/${listing.id}`}>{listing.title}</Link>
        </h3>
        <p>
          {listing.province} / {listing.municipality} / {listing.neighborhood}
        </p>
        <strong>{formatKz(listing.price)}</strong>
        {listing.category === 'Imóvel' ? (
          <p>
            {listing.propertyType} • {listing.bedrooms} quartos • {listing.bathrooms} WC •{' '}
            {listing.area}m²
          </p>
        ) : (
          <p>
            {listing.brand} {listing.model} • {listing.year} • {listing.mileage} km • {listing.fuel}
          </p>
        )}
        <p className="listing-excerpt">{listing.description}</p>
        <div className="listing-actions">
          <Link className="text-button" to={`/anuncio/${listing.id}`}>
            Ver detalhes
          </Link>
          <button className="text-button" type="button" onClick={() => onFavorite(listing.id)}>
            {favorites.includes(listing.id) ? 'Remover favorito' : 'Favoritar'}
          </button>
          <button className="text-button" type="button" onClick={() => onCompare(listing.id)}>
            {compareIds.includes(listing.id) ? 'Remover comparação' : 'Comparar'}
          </button>
          <a href={whatsappLink(listing)} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
        </div>
      </div>
    </article>
  )
}
