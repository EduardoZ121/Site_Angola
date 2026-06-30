import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ADMIN_EMAIL } from '../data/constants'
import { PendingListingsPanel } from '../components/staff/PendingListingsPanel'
import { useMarketplace } from '../context/MarketplaceContext'
import { isListingPending } from '../constants/staff'
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

  const pendingListings = listings.filter((listing) => isListingPending(listing))
  const otherListings = listings.filter((listing) => !isListingPending(listing))
  const rejectedCount = listings.filter((listing) => listing.status === 'Rejeitado').length
  const recentNotifications = notifications.slice(0, 12)

  function copyUserEmails() {
    const emails = siteUsers.map((user) => user.email).join(', ')
    if (emails && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(emails)
    }
  }

  if (!isLoggedIn) {
    return <Navigate to="/entrar?redirect=%2Fadmin" replace />
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
            <Link className="button primary" to="/inicio">
              Voltar ao início
            </Link>
          </div>
        </SectionBlock>
      </main>
    )
  }

  return (
    <main className="page-main staff-page">
      <PageIntro
        eyebrow="Administrador"
        title="Painel Kuteka"
        subtitle={`Sessão: ${profile.email} — controlo total do site, utilizadores e moderação.`}
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
        id="fila-aprovacao"
        eyebrow="Prioridade"
        title={`Aprovar anúncios (${pendingListings.length})`}
        subtitle="Revise fotos e perfil — rejeite fotos pessoais ou conteúdo inválido."
      >
        <PendingListingsPanel
          pendingListings={pendingListings}
          onApprove={approveListing}
          onReject={rejectListing}
          onDelete={deleteListing}
          canDelete
        />
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
