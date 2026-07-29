import { Link } from 'react-router-dom'
import { defaultPhoto } from '../../data/constants'
import { formatKz } from '../../utils/format'

export function CatalogFeaturedStrip({ listings, title = 'Destaques para arrendar' }) {
  if (!listings.length) return null

  return (
    <section className="catalog-featured-strip" aria-label={title}>
      <div className="catalog-featured-strip-head">
        <h2>{title}</h2>
        <Link to="/destaques">Ver todos</Link>
      </div>
      <div className="catalog-featured-scroll">
        {listings.map((listing) => {
          if (!listing?.id) return null
          return (
          <Link key={listing.id} className="catalog-featured-mini" to={`/anuncio/${listing.id}`}>
            <img src={listing.photos?.[0] || defaultPhoto} alt="" loading="lazy" />
            <div className="catalog-featured-mini-body">
              <strong>{listing.title}</strong>
              <span>{formatKz(listing.price)}</span>
              <span className="catalog-featured-mini-loc">
                {listing.municipality}, {listing.province}
              </span>
            </div>
          </Link>
          )
        })}
      </div>
    </section>
  )
}
