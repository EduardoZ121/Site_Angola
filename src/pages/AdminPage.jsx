import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ADMIN_EMAIL } from '../data/constants'
import { useMarketplace } from '../context/MarketplaceContext'
import { formatKz } from '../utils/format'
import { PageIntro, SectionBlock } from '../components/SectionBlock'

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('pt-PT')
  } catch {
    return value
  }
}

export default function AdminPage() {
  const {
    listings,
    siteUsers,
    notifications,
    isAdmin,
    isLoggedIn,
    profile,
    adminStats,
    approveListing,
    rejectListing,
    deleteListing,
    updateListing,
  } = useMarketplace()
  const [rejectReason, setRejectReason] = useState({})

  const pendingListings = listings.filter((listing) => listing.status === 'Pendente')
  const otherListings = listings.filter((listing) => listing.status !== 'Pendente')
  const rejectedCount = listings.filter((listing) => listing.status === 'Rejeitado').length
  const recentNotifications = notifications.slice(0, 12)

  function copyUserEmails() {
    const emails = siteUsers.map((user) => user.email).join(', ')
    if (emails && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(emails)
    }
  }

  function handleReject(listingId) {
    rejectListing(listingId, rejectReason[listingId] || '')
    setRejectReason((current) => ({ ...current, [listingId]: '' }))
  }

  if (!isLoggedIn) {
    return <Navigate to="/entrar?redirect=/admin" replace />
  }

  if (!isAdmin) {
    return (
      <main className="page-main">
        <PageIntro eyebrow="Admin" title="Acesso negado" subtitle="Esta área é só para o administrador Kuteka." />
        <SectionBlock>
          <div className="locked-admin panel-card">
            <strong>Sem permissão</strong>
            <p>
              O painel admin está disponível apenas para <strong>{ADMIN_EMAIL}</strong>.
              {profile.email ? ` Entrou como ${profile.email}.` : ''}
            </p>
            <Link className="button primary" to="/">
              Voltar ao início
            </Link>
          </div>
        </SectionBlock>
      </main>
    )
  }

  return (
    <main className="page-main">
      <PageIntro
        eyebrow="Administrador"
        title="Painel Kuteka"
        subtitle={`Sessão: ${profile.email} — aprovar anúncios e ver utilizadores.`}
      />

      <SectionBlock id="stats" eyebrow="Resumo" title="Números do site">
        <div className="admin-stats panel-card">
          <span>Utilizadores: {siteUsers.length}</span>
          <span>Total anúncios: {adminStats.total}</span>
          <span>Ativos: {adminStats.active}</span>
          <span>Pendentes: {adminStats.pending}</span>
          <span>Rejeitados: {rejectedCount}</span>
          <span>Destaques: {adminStats.featured}</span>
        </div>
      </SectionBlock>

      <SectionBlock
        id="utilizadores"
        eyebrow="Contas"
        title={`Utilizadores que entraram (${siteUsers.length})`}
        subtitle="Emails e logins via Google registados neste browser/dispositivo."
        tone="muted"
      >
        {siteUsers.length === 0 ? (
          <div className="empty-state panel-card">
            <p>Ainda ninguém entrou com Google neste ambiente.</p>
          </div>
        ) : (
          <>
            <div className="admin-actions admin-users-toolbar">
              <button className="button filter-button" type="button" onClick={copyUserEmails}>
                Copiar emails
              </button>
            </div>
            <div className="admin-users-table panel-card">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Utilizador</th>
                  <th>Email</th>
                  <th>Primeiro login</th>
                  <th>Último login</th>
                  <th>Vezes</th>
                </tr>
              </thead>
              <tbody>
                {siteUsers.map((user) => (
                  <tr key={user.email}>
                    <td>
                      <span className="admin-user-cell">
                        {user.picture ? <img className="nav-user-avatar" src={user.picture} alt="" /> : null}
                        {user.name}
                      </span>
                    </td>
                    <td>{user.email}</td>
                    <td>{formatDate(user.firstLoginAt)}</td>
                    <td>{formatDate(user.lastLoginAt)}</td>
                    <td>{user.loginCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </SectionBlock>

      <SectionBlock
        id="actividade"
        eyebrow="Actividade"
        title="Últimas notificações"
        subtitle="Pedidos de publicação, aprovações e rejeições (demo local)."
      >
        {recentNotifications.length === 0 ? (
          <div className="empty-state panel-card">
            <p>Sem actividade registada.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {recentNotifications.map((item) => (
              <article className="notification-card panel-card read" key={item.id}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
                <small>
                  {item.ownerEmail || item.ownerName || '—'} • {formatDate(item.createdAt)}
                </small>
              </article>
            ))}
          </div>
        )}
      </SectionBlock>

      <SectionBlock
        id="fila-aprovacao"
        eyebrow="Prioridade"
        title={`Aprovar anúncios (${pendingListings.length})`}
        subtitle="Revise fotos e perfil — rejeite fotos pessoais ou conteúdo inválido."
      >
        {pendingListings.length === 0 ? (
          <div className="empty-state panel-card">
            <p>Nenhum anúncio pendente.</p>
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
                  <button type="button" onClick={() => updateListing(listing.id, { status: 'Pausado' })}>
                    Pausar
                  </button>
                ) : listing.status === 'Pausado' ? (
                  <button type="button" onClick={() => approveListing(listing.id)}>
                    Reativar
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => updateListing(listing.id, { featured: !listing.featured })}
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
    </main>
  )
}
