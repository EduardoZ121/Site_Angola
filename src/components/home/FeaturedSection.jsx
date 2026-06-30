import { Link } from 'react-router-dom'
import { defaultPhoto } from '../../data/constants'
import { useMarketplace } from '../../context/MarketplaceContext'
import { formatKz } from '../../utils/format'

export function FeaturedSection({ hideHead = false }) {
  const { listings } = useMarketplace()
  const featured = listings
    .filter((item) => item.status === 'Ativo' && item.id)
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 4)

  return (
    <section className="hp-section hp-section-dark">
      <div className="hp-container">
        {hideHead ? null : (
          <div className="hp-section-head">
            <p className="hp-eyebrow">Destaques</p>
            <h2>Anúncios em destaque</h2>
            <p className="hp-section-lead light">Seleccionados pela equipa Kuteka esta semana.</p>
          </div>
        )}
        <div className="hp-featured-grid">
          {featured.map((listing) => (
            <Link
              key={listing.id}
              className="hp-featured-card hp-featured-card-link"
              to={`/anuncio/${listing.id}`}
            >
              <div className="hp-featured-badges">
                {listing.featured ? <span className="hp-badge hp-badge-featured">Destaque</span> : null}
                {listing.verified ? <span className="hp-badge hp-badge-verified">Verificado</span> : null}
              </div>
              <img src={listing.photos?.[0] || defaultPhoto} alt="" loading="lazy" />
              <div className="hp-featured-body">
                <span className="hp-featured-tag">
                  {listing.category} • {listing.operation}
                </span>
                <h3>{listing.title}</h3>
                <p>
                  {listing.province} / {listing.municipality}
                </p>
                <strong>{formatKz(listing.price)}</strong>
                <span className="hp-btn hp-btn-light hp-featured-cta">Ver anúncio</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
