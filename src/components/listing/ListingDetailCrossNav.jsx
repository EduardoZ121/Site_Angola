import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'
import {
  buildCatalogSearchLink,
  buildSimilarCatalogLink,
  getCatalogLabelForListing,
} from '../../utils/listingDetail'

export function ListingDetailCrossNav({ listing }) {
  const catalogLabel = getCatalogLabelForListing(listing)
  const zoneLink = buildCatalogSearchLink(listing)
  const similarLink = buildSimilarCatalogLink(listing)

  return (
    <nav className="listing-detail-cross-nav panel-card" aria-label="Explorar mais anúncios">
      <span className="listing-detail-cross-label">Continuar a explorar:</span>
      <div className="listing-detail-cross-links">
        <Link className="listing-detail-cross-link" to={zoneLink}>
          <HomeIcon name="pin" />
          Mais em {listing.neighborhood || listing.municipality}
        </Link>
        <Link className="listing-detail-cross-link" to={similarLink}>
          <HomeIcon name="search" />
          Ver {catalogLabel.toLowerCase()}
        </Link>
        <Link className="listing-detail-cross-link" to="/favoritos">
          <HomeIcon name="heart" />
          Favoritos
        </Link>
        <Link className="listing-detail-cross-link" to="/comparar">
          <HomeIcon name="columns" />
          Comparar
        </Link>
      </div>
    </nav>
  )
}
