import { Link } from 'react-router-dom'
import {
  buildCatalogSearchLink,
  getCatalogLabelForListing,
} from '../../utils/listingDetail'

export function PublishSubmittedActions({ listing, isApproved, isRejected, isPending }) {
  const catalogLink = buildCatalogSearchLink(listing)
  const catalogLabel = getCatalogLabelForListing(listing)

  return (
    <div className="publish-submitted-actions">
      {isApproved ? (
        <>
          <Link className="button primary" to={`/anuncio/${listing.id}`}>
            Ver anúncio publicado
          </Link>
          <Link className="button filter-button" to={catalogLink}>
            Ver em {catalogLabel}
          </Link>
        </>
      ) : null}

      {isRejected ? (
        <Link className="button primary" to={`/painel/editar/${listing.id}`}>
          Corrigir e reenviar
        </Link>
      ) : null}

      {isPending ? (
        <Link className="button primary" to="/painel">
          Acompanhar no painel
        </Link>
      ) : (
        <Link className="button filter-button" to="/painel">
          Ir ao painel
        </Link>
      )}

      <Link className="button filter-button" to="/conta">
        Ver mensagens na conta
      </Link>
      <Link className="text-button" to="/inicio">
        Voltar ao início
      </Link>
    </div>
  )
}
