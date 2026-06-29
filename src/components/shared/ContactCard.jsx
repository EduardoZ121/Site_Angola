import { whatsappLink } from '../../utils/format'
import { AnalyticsEvents, trackEvent } from '../../services/analytics'

export function ContactCard({ listing, onMessage, onFavorite, isFavorite, verifiedSeal }) {
  return (
    <aside className="listing-contact-card panel-card" aria-label="Contactar anunciante">
      <div className="contact-owner">
        <div className="contact-avatar" aria-hidden="true">
          {listing.owner.name?.charAt(0) || 'K'}
        </div>
        <div>
          <strong>{listing.owner.name}</strong>
          <p>{listing.owner.type}</p>
          {verifiedSeal ? <span className="contact-verified">Conta verificada</span> : null}
          {listing.owner.memberSince ? (
            <p className="contact-since">Na Kuteka desde {listing.owner.memberSince.slice(0, 10)}</p>
          ) : null}
        </div>
      </div>
      <div className="contact-actions">
        <a
          className="button primary"
          href={`tel:${listing.owner.phone}`}
          onClick={() => trackEvent(AnalyticsEvents.CONTACT_OWNER, { listingId: listing.id })}
        >
          Ligar
        </a>
        <a
          className="button secondary"
          href={whatsappLink(listing)}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackEvent(AnalyticsEvents.CLICK_WHATSAPP, { listingId: listing.id })}
        >
          WhatsApp
        </a>
        <button className="button ghost" type="button" onClick={onMessage}>
          Mensagem
        </button>
        <button className="button ghost" type="button" onClick={onFavorite}>
          {isFavorite ? 'Remover favorito' : 'Guardar favorito'}
        </button>
      </div>
    </aside>
  )
}
