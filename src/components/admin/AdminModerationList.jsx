import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatKz } from '../../utils/format'

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'Ativo', label: 'Activos' },
  { id: 'Pausado', label: 'Pausados' },
  { id: 'Rejeitado', label: 'Rejeitados' },
]

export function AdminModerationList({
  listings = [],
  onPause,
  onReactivate,
  onToggleFeatured,
  onDelete,
  onAdminPatch,
}) {
  const [filter, setFilter] = useState('all')

  const filtered = useMemo(() => {
    if (filter === 'all') return listings
    return listings.filter((listing) => listing.status === filter)
  }, [filter, listings])

  const counts = useMemo(
    () => ({
      all: listings.length,
      Ativo: listings.filter((item) => item.status === 'Ativo').length,
      Pausado: listings.filter((item) => item.status === 'Pausado').length,
      Rejeitado: listings.filter((item) => item.status === 'Rejeitado').length,
    }),
    [listings],
  )

  function handleDelete(listingId, title) {
    if (!window.confirm(`Apagar permanentemente «${title}»?`)) return
    onDelete(listingId)
  }

  function handleResetViews(listing) {
    if (!onAdminPatch) return
    onAdminPatch(listing.id, { views: 0 })
  }

  function handleToggleVerified(listing) {
    if (!onAdminPatch) return
    onAdminPatch(listing.id, {
      verifiedDocument: !listing.verifiedDocument,
      verifiedProfile: !listing.verifiedDocument,
      trustSeal: listing.verifiedDocument ? '' : 'Prata',
    })
  }

  if (!listings.length) {
    return (
      <div className="empty-state panel-card">
        <p>Nenhum anúncio fora da fila de aprovação.</p>
      </div>
    )
  }

  return (
    <>
      <div className="admin-filter-row" role="tablist" aria-label="Filtrar anúncios">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={`admin-filter-pill ${filter === item.id ? 'active' : ''}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
            <span className="admin-filter-count">{counts[item.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state panel-card">
          <p>Nenhum anúncio neste filtro.</p>
          <button className="button filter-button" type="button" onClick={() => setFilter('all')}>
            Ver todos
          </button>
        </div>
      ) : (
        <div className="admin-list">
          {filtered.map((listing) => (
            <div className="admin-row panel-card" key={listing.id}>
              <div className="admin-row-main">
                <div className="admin-row-head">
                  <strong>{listing.title}</strong>
                  <span className={`status-pill status-${listing.status.toLowerCase()}`}>
                    {listing.status}
                  </span>
                  {listing.featured ? <span className="admin-featured-pill">Destaque</span> : null}
                  {listing.isDemo ? <span className="admin-featured-pill">Demo</span> : null}
                </div>
                <p className="admin-row-meta">
                  {listing.neighborhood} — {formatKz(listing.price)} — {listing.ownerName || listing.ownerEmail}
                  {' · '}
                  {listing.views || 0} views
                  {listing.verifiedDocument ? ' · Verificado' : ''}
                </p>
              </div>
              <div className="admin-actions">
                {listing.status === 'Ativo' ? (
                  <>
                    <Link className="button ghost" to={`/anuncio/${listing.id}`}>
                      Ver público
                    </Link>
                    <button type="button" className="button ghost" onClick={() => onPause(listing.id)}>
                      Pausar
                    </button>
                  </>
                ) : null}
                {listing.status === 'Pausado' ? (
                  <button type="button" className="button ghost" onClick={() => onReactivate(listing.id)}>
                    Reativar
                  </button>
                ) : null}
                {listing.status === 'Rejeitado' ? (
                  <Link className="button ghost" to={`/publicar/enviado/${listing.id}`}>
                    Ver estado
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => handleResetViews(listing)}
                >
                  Zerar views
                </button>
                <button
                  type="button"
                  className="button ghost"
                  onClick={() => handleToggleVerified(listing)}
                >
                  {listing.verifiedDocument ? 'Remover verificado' : 'Marcar verificado'}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => onToggleFeatured(listing.id, !listing.featured)}
                >
                  {listing.featured ? 'Remover destaque' : 'Destacar'}
                </button>
                <button
                  type="button"
                  className="button ghost danger-text"
                  onClick={() => handleDelete(listing.id, listing.title)}
                >
                  Apagar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
