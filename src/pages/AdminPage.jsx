import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ADMIN_EMAIL } from '../data/constants'
import { useMarketplace } from '../context/MarketplaceContext'
import { formatKz } from '../utils/format'
import { PageIntro, SectionBlock } from '../components/SectionBlock'

export default function AdminPage() {
  const {
    listings,
    adminEmail,
    setAdminEmail,
    isAdmin,
    adminStats,
    approveListing,
    rejectListing,
    deleteListing,
    updateListing,
  } = useMarketplace()
  const [rejectReason, setRejectReason] = useState({})

  const pendingListings = listings.filter((listing) => listing.status === 'Pendente')
  const otherListings = listings.filter((listing) => listing.status !== 'Pendente')

  function handleReject(listingId) {
    rejectListing(listingId, rejectReason[listingId] || '')
    setRejectReason((current) => ({ ...current, [listingId]: '' }))
  }

  return (
    <main className="page-main">
      <PageIntro
        eyebrow="Admin"
        title="Painel de moderação"
        subtitle="Aprove anúncios e perfis antes de ficarem visíveis no site."
      />

      <SectionBlock id="acesso" eyebrow="Acesso" title="Entrar como administrador" tone="muted">
        <div className="admin-card panel-card">
          <label>
            Email admin demo
            <input
              placeholder={ADMIN_EMAIL}
              type="email"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
            />
          </label>
          <small>
            Para testar agora, use: <strong>{ADMIN_EMAIL}</strong>
          </small>
        </div>
      </SectionBlock>

      {isAdmin ? (
        <>
          <SectionBlock
            id="fila-aprovacao"
            eyebrow="Prioridade"
            title={`Fila de aprovação (${pendingListings.length})`}
            subtitle="Revise fotos e perfil — evite publicações tipo rede social."
          >
            {pendingListings.length === 0 ? (
              <div className="empty-state panel-card">
                <p>Nenhum anúncio pendente neste momento.</p>
              </div>
            ) : (
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
                      <button className="button primary" type="button" onClick={() => approveListing(listing.id)}>
                        Aprovar e publicar
                      </button>
                      <button className="button filter-button" type="button" onClick={() => handleReject(listing.id)}>
                        Rejeitar
                      </button>
                      <button type="button" onClick={() => deleteListing(listing.id)}>
                        Apagar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionBlock>

          <SectionBlock
            id="moderacao"
            eyebrow="Anúncios"
            title="Todos os anúncios"
            subtitle="Gerir activos, pausados e rejeitados."
            tone="muted"
          >
            <div className="admin-stats">
              <span>Total: {adminStats.total}</span>
              <span>Ativos: {adminStats.active}</span>
              <span>Pendentes: {adminStats.pending}</span>
              <span>Destaques: {adminStats.featured}</span>
            </div>
            <div className="admin-list">
              {otherListings.map((listing) => (
                <div className="admin-row panel-card" key={listing.id}>
                  <div>
                    <strong>{listing.title}</strong>
                    <span>
                      {listing.status} — {listing.neighborhood} — {formatKz(listing.price)}
                    </span>
                  </div>
                  <div className="admin-actions">
                    {listing.status === 'Ativo' ? (
                      <button
                        type="button"
                        onClick={() => updateListing(listing.id, { status: 'Pausado' })}
                      >
                        Pausar
                      </button>
                    ) : listing.status === 'Pausado' ? (
                      <button type="button" onClick={() => approveListing(listing.id)}>
                        Reativar
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        updateListing(listing.id, { featured: !listing.featured })
                      }
                    >
                      {listing.featured ? 'Remover destaque' : 'Destacar'}
                    </button>
                    <button type="button" onClick={() => deleteListing(listing.id)}>
                      Apagar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SectionBlock>
        </>
      ) : (
        <SectionBlock id="moderacao" title="Área bloqueada">
          <div className="locked-admin panel-card">
            <strong>Admin bloqueado</strong>
            <span>Insira o email admin demo para ver a fila de aprovação.</span>
          </div>
        </SectionBlock>
      )}
    </main>
  )
}
