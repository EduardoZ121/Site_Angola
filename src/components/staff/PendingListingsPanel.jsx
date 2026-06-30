import { useState } from 'react'
import { formatKz } from '../../utils/format'

export function PendingListingsPanel({
  pendingListings,
  onApprove,
  onReject,
  onDelete,
  canDelete = false,
  emptyMessage = 'Nenhum anúncio pendente.',
}) {
  const [rejectReason, setRejectReason] = useState({})

  function handleReject(listingId) {
    onReject(listingId, rejectReason[listingId] || '')
    setRejectReason((current) => ({ ...current, [listingId]: '' }))
  }

  if (!pendingListings.length) {
    return (
      <div className="empty-state panel-card">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="admin-pending-list">
      {pendingListings.map((listing) => (
        <article className="admin-pending-card panel-card" key={listing.id}>
          <div className="admin-pending-grid">
            <div className="preview-strip compact">
              {listing.photos?.slice(0, 4).map((photo, index) => (
                <img src={photo} alt={`Foto ${index + 1}`} key={`${listing.id}-p-${index}`} />
              ))}
            </div>
            <div>
              <div className="listing-meta">
                <span className="status-pill status-pending">Pendente</span>
                <span>{listing.category}</span>
                <span>{listing.operation}</span>
              </div>
              <strong>{listing.title}</strong>
              <p>
                {listing.neighborhood} — {formatKz(listing.price)}
              </p>
              <p className="admin-owner-line">
                {listing.ownerName} • {listing.ownerType} • {listing.phone}
                {listing.ownerEmail ? ` • ${listing.ownerEmail}` : ''}
              </p>
              <p>{listing.description}</p>
              {listing.submittedAt ? (
                <small>Enviado: {new Date(listing.submittedAt).toLocaleString('pt-PT')}</small>
              ) : null}
            </div>
          </div>
          <label>
            Motivo de rejeição (opcional)
            <input
              placeholder="Ex.: fotos pessoais, não é imóvel..."
              value={rejectReason[listing.id] || ''}
              onChange={(event) =>
                setRejectReason((current) => ({
                  ...current,
                  [listing.id]: event.target.value,
                }))
              }
            />
          </label>
          <div className="admin-actions">
            <button className="button primary" type="button" onClick={() => onApprove(listing.id)}>
              Aprovar e publicar
            </button>
            <button className="button filter-button" type="button" onClick={() => handleReject(listing.id)}>
              Rejeitar
            </button>
            {canDelete && onDelete ? (
              <button type="button" onClick={() => onDelete(listing.id)}>
                Apagar
              </button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}
