import { useNavigate } from 'react-router-dom'
import { defaultPhoto } from '../data/constants'
import { formatKz } from '../utils/format'
import { TrustBadge } from './ui'
import '../styles/listing-card.css'

/** Cartão de catálogo — preview; toque abre a página do anúncio. */
export function ListingCard({ listing, favorites, onFavorite, compact = false }) {
  const navigate = useNavigate()
  const isFavorite = favorites.includes(listing.id)

  function openDetail(event) {
    if (event.target.closest('.listing-card-fav')) return
    navigate(`/anuncio/${listing.id}`)
  }

  function handleFavorite(event) {
    event.preventDefault()
    event.stopPropagation()
    onFavorite?.(listing.id)
  }

  return (
    <article
      className={`listing-card listing-card-clickable${compact ? ' listing-card-compact' : ''}`}
      onClick={openDetail}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openDetail(event)
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`Abrir anúncio ${listing.title}`}
    >
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
        <span className="listing-card-cta">Ver anúncio</span>
      </div>

      <button
        type="button"
        className={`listing-card-fav${isFavorite ? ' active' : ''}`}
        aria-label={isFavorite ? 'Remover dos favoritos' : 'Guardar favorito'}
        onClick={handleFavorite}
      >
        {isFavorite ? '★' : '☆'}
      </button>
    </article>
  )
}
