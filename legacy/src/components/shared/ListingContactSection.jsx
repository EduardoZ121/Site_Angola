import { useEffect, useState } from 'react'
import { HomeIcon } from '../icons/HomeIcon'
import { AnalyticsEvents, trackEvent } from '../../services/analytics'
import { whatsappLink } from '../../utils/format'

export function ListingContactSection({
  listing,
  messages,
  chatInput,
  onChatInput,
  onSendChat,
  onMessageFocus,
  isFavorite,
  onFavorite,
  verifiedSeal,
  initialChatOpen = false,
}) {
  const [chatOpen, setChatOpen] = useState(initialChatOpen)

  useEffect(() => {
    if (initialChatOpen) setChatOpen(true)
  }, [initialChatOpen])
  const owner = listing.owner
  const phone = owner.phone || listing.phone

  function track(channel) {
    trackEvent(AnalyticsEvents.CONTACT_OWNER, { listingId: listing.id, channel })
  }

  return (
    <section className="listing-contact-section panel-card" id="contactar">
      <header className="listing-contact-head">
        <h2>Contactar anunciante</h2>
        <p>Dados publicados pelo senhorio na conta Kuteka.</p>
      </header>

      <div className="listing-contact-owner">
        <div className="listing-contact-avatar" aria-hidden="true">
          {owner.avatar ? (
            <img src={owner.avatar} alt="" />
          ) : (
            owner.name?.charAt(0) || 'K'
          )}
        </div>
        <div className="listing-contact-owner-text">
          <strong>{owner.name || 'Anunciante'}</strong>
          <span>{owner.type || 'Proprietário'}</span>
          {verifiedSeal ? <span className="listing-contact-verified">Conta verificada</span> : null}
          {phone ? <span className="listing-contact-phone">{phone}</span> : null}
          {owner.email ? <span className="listing-contact-email">{owner.email}</span> : null}
        </div>
      </div>

      <div className="listing-contact-actions">
        {phone ? (
          <a
            className="listing-contact-btn listing-contact-btn-primary"
            href={`tel:${phone}`}
            onClick={() => track('phone')}
          >
            <HomeIcon name="phone" />
            <span>Ligar</span>
          </a>
        ) : null}
        {phone ? (
          <a
            className="listing-contact-btn"
            href={whatsappLink(listing)}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackEvent(AnalyticsEvents.CLICK_WHATSAPP, { listingId: listing.id })}
          >
            <span className="listing-contact-wa">WA</span>
            <span>WhatsApp</span>
          </a>
        ) : null}
        {owner.email ? (
          <a
            className="listing-contact-btn"
            href={`mailto:${owner.email}?subject=${encodeURIComponent(`Kuteka — ${listing.title}`)}&body=${encodeURIComponent(`Olá, vi o anúncio "${listing.title}" (Ref. ${listing.reference}) na Kuteka.`)}`}
            onClick={() => track('email')}
          >
            <HomeIcon name="message" />
            <span>Email</span>
          </a>
        ) : null}
        <button
          type="button"
          className="listing-contact-btn"
          onClick={() => {
            setChatOpen(true)
            onMessageFocus?.()
          }}
        >
          <HomeIcon name="message" />
          <span>Mensagem</span>
        </button>
      </div>

      <div className="listing-contact-secondary">
        <button type="button" className="listing-contact-fav" onClick={onFavorite}>
          <HomeIcon name="heart" />
          <span>{isFavorite ? 'Guardado nos favoritos' : 'Guardar nos favoritos'}</span>
        </button>
      </div>

      {chatOpen ? (
        <div className="listing-contact-chat" id="chat">
          <h3>Mensagem na Kuteka</h3>
          <div className="listing-contact-chat-box">
            {messages.length === 0 ? (
              <p className="listing-contact-chat-empty">Escreva ao anunciante. Precisa de entrar na conta.</p>
            ) : (
              messages.map((message, index) => (
                <p key={`${listing.id}-msg-${index}`}>
                  <strong>{message.who}</strong>: {message.text}
                </p>
              ))
            )}
          </div>
          <div className="listing-contact-chat-row">
            <input
              value={chatInput}
              onChange={(event) => onChatInput(event.target.value)}
              placeholder="A sua mensagem..."
              aria-label="Mensagem para o anunciante"
            />
            <button type="button" className="button primary" onClick={onSendChat}>
              Enviar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
