import { Link } from 'react-router-dom'
import { defaultPhoto } from '../../data/constants'
import { useMarketplace } from '../../context/MarketplaceContext'
import { formatKz } from '../../utils/format'

export function FeaturedSection({ hideHead = false }) {
  const { listings } = useMarketplace()
  const featured = listings
    .filter((item) => item.status === 'Ativo' && item.featured)
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 4)

  return (
    <section className="hp-section hp-section-dark">
      <div className="hp-container">
        {hideHead ? null : (
          <div className="hp-section-head">
            <p className="hp-eyebrow">Destaques</p>
            <h2>Anúncios em destaque</h2>
            <p className="hp-section-lead light">Seleccionados do catálogo activo — clique para ver detalhes.</p>
          </div>
        )}
        {featured.length === 0 ? (
          <div className="hp-featured-empty">
            <p>Ainda não há anúncios activos em destaque.</p>
            <Link className="hp-btn hp-btn-light" to="/comprar">
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            <div className="hp-featured-grid">
              {featured.map((listing) => (
                <Link
                  key={listing.id}
                  className="hp-featured-card hp-featured-card-link"
                  to={`/anuncio/${listing.id}`}
                >
                  <div className="hp-featured-badges">
                    {listing.featured ? <span className="hp-badge hp-badge-featured">Destaque</span> : null}
                    {listing.verifiedProfile || listing.verifiedPhone ? (
                      <span className="hp-badge hp-badge-verified">Verificado</span>
                    ) : null}
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
            <div className="hp-featured-more">
              <Link className="hp-btn hp-btn-secondary" to="/destaques">
                Ver todos os destaques
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
