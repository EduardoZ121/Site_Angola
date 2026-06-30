import { Link } from 'react-router-dom'
import { defaultPhoto } from '../data/constants'
import { formatKz } from '../utils/format'
import { TrustBadge } from './ui'
import '../styles/listing-card.css'

/** Cartão de catálogo — só preview; contacto fica na página do anúncio. */
export function ListingCard({ listing, favorites, onFavorite, compact = false }) {
  const isFavorite = favorites.includes(listing.id)

  return (
    <article className={`listing-card${compact ? ' listing-card-compact' : ''}`}>
      <Link className="listing-card-link" to={`/anuncio/${listing.id}`} aria-label={`Abrir ${listing.title}`}>
        <div className="listing-card-media">
          <img src={listing.photos?.[0] || defaultPhoto} alt="" loading="lazy" />
          {listing.featured ? <span className="listing-card-badge">Destaque</span> : null}
        </div>
        <div className="listing-body">
          <div className="listing-meta">
            <span>{listing.operation}</span>
            <TrustBadge listing={listing} />
          </div>
          <h3>{listing.title}</h3>
          <p className="listing-card-loc">
            {listing.municipality}, {listing.province}
          </p>
          <strong className="listing-card-price">{formatKz(listing.price)}</strong>
          {listing.category === 'Imóvel' ? (
            <p className="listing-card-specs">
              {listing.propertyType}
              {listing.bedrooms ? ` · ${listing.bedrooms} quartos` : ''}
              {listing.area ? ` · ${listing.area} m²` : ''}
            </p>
          ) : (
            <p className="listing-card-specs">
              {listing.brand} {listing.model}
              {listing.year ? ` · ${listing.year}` : ''}
            </p>
          )}
          <span className="listing-card-cta">Ver anúncio →</span>
        </div>
      </Link>
      <button
        type="button"
        className={`listing-card-fav${isFavorite ? ' active' : ''}`}
        aria-label={isFavorite ? 'Remover dos favoritos' : 'Guardar favorito'}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onFavorite?.(listing.id)
        }}
      >
        {isFavorite ? '★' : '☆'}
      </button>
    </article>
  )
}
