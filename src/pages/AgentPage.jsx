import { Link, Navigate } from 'react-router-dom'
import { AGENT_EMAIL } from '../data/constants'
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

export default function AgentPage() {
  const {
    listings,
    chatByListing,
    notifications,
    isAgent,
    isAdmin,
    isLoggedIn,
    profile,
    approveListing,
    rejectListing,
  } = useMarketplace()

  const pendingListings = listings.filter((listing) => isListingPending(listing))
  const staffAlerts = notifications.filter((item) => item.audience === 'staff').slice(0, 8)

  const inquiryThreads = Object.entries(chatByListing)
    .map(([listingId, messages]) => {
      const listing = listings.find((item) => item.id === listingId)
      const last = messages[messages.length - 1]
      return { listingId, listing, messages, last }
    })
    .filter((thread) => thread.last)
    .sort((a, b) => new Date(b.last?.at || 0) - new Date(a.last?.at || 0))

  if (!isLoggedIn) {
    return <Navigate to="/entrar?redirect=%2Fagente" replace />
  }

  if (!isAgent && !isAdmin) {
    return (
      <main className="page-main">
        <PageIntro eyebrow="Equipa" title="Acesso reservado" subtitle="Área para agentes Kuteka." />
        <SectionBlock>
          <div className="locked-admin panel-card">
            <strong>Sem permissão</strong>
            <p>
              O painel de agente está disponível para <strong>{AGENT_EMAIL}</strong>.
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
        eyebrow="Agente Kuteka"
        title="Painel do agente"
        subtitle={`${profile.email} — aprovar anúncios, responder clientes e planear visitas.`}
      />

      <SectionBlock id="fila" eyebrow="Prioridade" title={`Anúncios pendentes (${pendingListings.length})`}>
        <PendingListingsPanel
          pendingListings={pendingListings}
          onApprove={approveListing}
          onReject={rejectListing}
          emptyMessage="Nenhum anúncio aguarda aprovação."
        />
      </SectionBlock>

      <SectionBlock
        id="mensagens"
        eyebrow="Clientes"
        title="Mensagens e contactos"
        subtitle="Conversas iniciadas na página do anúncio — responda por telefone ou WhatsApp."
        tone="muted"
      >
        {inquiryThreads.length === 0 ? (
          <div className="empty-state panel-card">
            <p>Ainda não há mensagens de compradores neste dispositivo.</p>
          </div>
        ) : (
          <div className="staff-inquiry-list">
            {inquiryThreads.map(({ listingId, listing, last, messages }) => (
              <article className="staff-inquiry-card panel-card" key={listingId}>
                <div>
                  <strong>{listing?.title || listingId}</strong>
                  <p>
                    {listing ? `${listing.neighborhood} — ${formatKz(listing.price)}` : 'Anúncio'}
                  </p>
                  <p className="staff-inquiry-msg">{last.text}</p>
                  <small>
                    {last.author} • {formatDate(last.at)} • {messages.length} mensagem(ns)
                  </small>
                </div>
                <div className="admin-actions">
                  {listing ? (
                    <>
                      <Link className="button primary" to={`/anuncio/${listing.id}#contactar`}>
                        Ver anúncio
                      </Link>
                      <a className="button filter-button" href={`tel:${listing.phone}`}>
                        Ligar
                      </a>
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionBlock>

      <SectionBlock
        id="visitas"
        eyebrow="Operações"
        title="Visitas ao local"
        subtitle="Agendar e acompanhar visitas com proprietários e compradores."
      >
        <div className="empty-state panel-card staff-soon-card">
          <strong>Em breve</strong>
          <p>
            Aqui poderá marcar visitas, confirmar horários e registar feedback após cada visita ao imóvel ou
            veículo.
          </p>
        </div>
      </SectionBlock>

      {staffAlerts.length ? (
        <SectionBlock id="alertas" eyebrow="Actividade" title="Alertas recentes" tone="muted">
          <div className="notifications-list">
            {staffAlerts.map((item) => (
              <article className="notification-card panel-card read" key={item.id}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
                <small>{formatDate(item.createdAt)}</small>
              </article>
            ))}
          </div>
        </SectionBlock>
      ) : null}
    </main>
  )
}
