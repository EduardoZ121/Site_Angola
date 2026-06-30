import { Link } from 'react-router-dom'
import { getOwnerStatusLabel, getOwnerStatusTone } from '../../utils/ownerListing'
import { formatKz } from '../../utils/format'
import { defaultPhoto } from '../../data/constants'

export function ListingStatusBadge({ listing }) {
  const tone = getOwnerStatusTone(listing)
  return (
    <span className={`owner-status-badge tone-${tone}`}>{getOwnerStatusLabel(listing)}</span>
  )
}

export function OwnerListingCard({
  listing,
  favoriteCount = 0,
  onDuplicate,
  onPause,
  onActivate,
  onArchive,
  onRenewFeatured,
  onDelete,
}) {
  const isActive = listing.status === 'Ativo'
  const isPaused = listing.status === 'Pausado'
  const isPending = listing.status === 'Pendente'
  const isRejected = listing.status === 'Rejeitado'
  const canEdit = !isPending

  return (
    <article className="owner-listing-card panel-card">
      <img src={listing.photos?.[0] || defaultPhoto} alt="" className="owner-listing-thumb" />
      <div className="owner-listing-body">
        <div className="owner-listing-head">
          <div>
            <strong>{listing.title}</strong>
            <p>
              {formatKz(listing.price)} · {listing.province} / {listing.neighborhood}
            </p>
          </div>
          <ListingStatusBadge listing={listing} />
        </div>

        {isRejected && listing.rejectReason ? (
          <div className="owner-reject-reason" role="alert">
            <strong>Motivo da rejeição</strong>
            <p>{listing.rejectReason}</p>
          </div>
        ) : null}

        <div className="owner-listing-stats">
          <span>{listing.views || 0} visualizações</span>
          <span>{favoriteCount} favoritos</span>
          {listing.featured ? <span className="owner-featured-tag">Destaque</span> : null}
          {listing.featuredUntil ? (
            <span>Destaque até {listing.featuredUntil.slice(0, 10)}</span>
          ) : null}
        </div>

        <div className="owner-listing-actions">
          {isActive ? (
            <Link className="button ghost" to={`/anuncio/${listing.id}`}>
              Ver público
            </Link>
          ) : isPending ? (
            <Link className="button ghost" to={`/publicar/enviado/${listing.id}`}>
              Ver pedido
            </Link>
          ) : null}
          {isRejected ? (
            <Link className="button primary" to={`/painel/editar/${listing.id}`}>
              Corrigir e reenviar
            </Link>
          ) : null}
          {canEdit ? (
            <Link className="button ghost" to={`/painel/editar/${listing.id}`}>
              Editar
            </Link>
          ) : null}
          <button type="button" className="button ghost" onClick={() => onDuplicate(listing.id)}>
            Duplicar
          </button>
          {isActive ? (
            <button type="button" className="button ghost" onClick={() => onPause(listing.id)}>
              Pausar
            </button>
          ) : null}
          {isPaused ? (
            <button type="button" className="button ghost" onClick={() => onActivate(listing.id)}>
              Reactivar
            </button>
          ) : null}
          {isActive && !listing.featured ? (
            <button type="button" className="button secondary" onClick={() => onRenewFeatured(listing.id)}>
              Destacar
            </button>
          ) : null}
          {listing.featured ? (
            <button type="button" className="button secondary" onClick={() => onRenewFeatured(listing.id)}>
              Renovar destaque
            </button>
          ) : null}
          {!isPending ? (
            <button type="button" className="button ghost danger-text" onClick={() => onArchive(listing.id)}>
              Arquivar
            </button>
          ) : null}
          {isRejected ? (
            <button type="button" className="button ghost danger-text" onClick={() => onDelete(listing.id)}>
              Eliminar
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
