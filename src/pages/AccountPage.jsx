import { Link } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { Toggle } from '../components/ui'
import { PageIntro, SectionBlock } from '../components/SectionBlock'
import { formatKz, trustSealFromProfile } from '../utils/format'

const statusLabels = {
  Pendente: 'Pendente',
  Ativo: 'Publicado',
  Pausado: 'Pausado',
  Rejeitado: 'Rejeitado',
}

export default function AccountPage() {
  const {
    profile,
    setProfile,
    accountTypes,
    getMyListings,
    getMyNotifications,
    markNotificationRead,
    logoutAccount,
  } = useMarketplace()

  const myListings = getMyListings()
  const notifications = getMyNotifications()

  return (
    <main className="page-main">
      <PageIntro
        eyebrow="Minha conta"
        title="Perfil e verificação"
        subtitle="Conta ligada — recebe emails e notificações sobre os seus anúncios."
      />

      <SectionBlock
        id="google-conta"
        eyebrow="Conta Google"
        title="Sessão Google activa"
        tone="muted"
      >
        <div className="google-session-card panel-card">
          <div className="profile-review-head">
            {profile.picture ? (
              <img className="nav-user-avatar large" src={profile.picture} alt="" />
            ) : (
              <span className="profile-avatar">{profile.name?.charAt(0) || '?'}</span>
            )}
            <div>
              <strong>{profile.name}</strong>
              <p>{profile.email}</p>
              <small>Conta Google • emails activos para notificações Kuteka</small>
            </div>
          </div>
          <button className="text-button" type="button" onClick={logoutAccount}>
            Terminar sessão Google
          </button>
        </div>
      </SectionBlock>

      <SectionBlock id="mensagens" eyebrow="Mensagens" title="Notificações e email">
        {notifications.length === 0 ? (
          <div className="empty-state panel-card">
            <p>Ainda não tem mensagens.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((item) => (
              <article
                className={`notification-card panel-card ${item.read ? 'read' : 'unread'}`}
                key={item.id}
              >
                <div className="notification-head">
                  <strong>{item.title}</strong>
                  {!item.read ? <span className="status-pill status-pending">Nova</span> : null}
                </div>
                <p>{item.body}</p>
                {item.emailSent ? (
                  <small className="email-sent-line">✉ Email enviado (demo) para {item.ownerEmail || profile.email || 'si'}</small>
                ) : null}
                <div className="notification-actions">
                  {!item.read ? (
                    <button className="text-button" type="button" onClick={() => markNotificationRead(item.id)}>
                      Marcar como lida
                    </button>
                  ) : null}
                  {item.listingId && item.type === 'listing_approved' ? (
                    <Link className="text-button" to={`/anuncio/${item.listingId}`}>
                      Ver anúncio publicado
                    </Link>
                  ) : null}
                  {item.listingId && item.type === 'listing_pending' ? (
                    <Link className="text-button" to={`/publicar/enviado/${item.listingId}`}>
                      Ver pedido pendente
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionBlock>

      <SectionBlock id="meus-anuncios" eyebrow="Publicações" title="Os meus anúncios" tone="muted">
        {myListings.length === 0 ? (
          <div className="empty-state panel-card">
            <p>Ainda não publicou nenhum anúncio.</p>
            <Link className="button primary" to="/publicar">
              Publicar agora
            </Link>
          </div>
        ) : (
          <div className="my-listings-list">
            {myListings.map((listing) => (
              <article className="my-listing-row panel-card" key={listing.id}>
                <div>
                  <strong>{listing.title}</strong>
                  <p>
                    {formatKz(listing.price)} — {listing.neighborhood}
                  </p>
                </div>
                <span className={`status-pill status-${listing.status.toLowerCase()}`}>
                  {statusLabels[listing.status] || listing.status}
                </span>
                <Link
                  className="text-button"
                  to={
                    listing.status === 'Ativo'
                      ? `/anuncio/${listing.id}`
                      : `/publicar/enviado/${listing.id}`
                  }
                >
                  Abrir
                </Link>
              </article>
            ))}
          </div>
        )}
      </SectionBlock>

      <SectionBlock id="dados" eyebrow="Dados" title="Informações pessoais">
        <form className="owner-form panel-card">
          <div className="form-row">
            <label>
              Nome
              <input
                value={profile.name}
                onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label>
              Email
              <input
                value={profile.email}
                readOnly={profile.authProvider === 'google'}
                onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Telefone (+244...)
              <input
                value={profile.phone}
                onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
              />
            </label>
            <label>
              Tipo de conta
              <select
                value={profile.type}
                onChange={(event) => setProfile((current) => ({ ...current, type: event.target.value }))}
              >
                {accountTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>
        </form>
      </SectionBlock>

      <SectionBlock
        id="verificacao"
        eyebrow="Confiança"
        title="Verificação e selo"
        subtitle="Active as verificações para aumentar contactos."
        tone="muted"
      >
        <div className="profile-grid">
          <div className="panel-card">
            <div className="toggle-row">
              <Toggle
                label="Perfil verificado"
                checked={profile.verifiedProfile}
                onToggle={() => setProfile((current) => ({ ...current, verifiedProfile: !current.verifiedProfile }))}
              />
              <Toggle
                label="Telefone verificado"
                checked={profile.verifiedPhone}
                onToggle={() => setProfile((current) => ({ ...current, verifiedPhone: !current.verifiedPhone }))}
              />
              <Toggle
                label="Documento validado"
                checked={profile.verifiedDocument}
                onToggle={() => setProfile((current) => ({ ...current, verifiedDocument: !current.verifiedDocument }))}
              />
            </div>
          </div>
          <aside className="trust-card panel-card">
            <strong>Selo de confiança</strong>
            <p>{trustSealFromProfile(profile)}</p>
            <small>Anúncios com selo recebem mais contactos directos.</small>
          </aside>
        </div>
      </SectionBlock>
    </main>
  )
}
