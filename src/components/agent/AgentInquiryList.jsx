import { Link } from 'react-router-dom'
import { formatKz } from '../../utils/format'
import { formatStaffDate } from '../../utils/agent'

export function AgentInquiryList({ threads = [] }) {
  if (!threads.length) {
    return (
      <div className="empty-state panel-card">
        <p>Ainda não há mensagens de compradores neste dispositivo.</p>
        <Link className="text-button" to="/explorar">
          Ver anúncios no catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="staff-inquiry-list">
      {threads.map(({ listingId, listing, last, messages }) => (
        <article className="staff-inquiry-card panel-card" key={listingId}>
          <div>
            <strong>{listing?.title || listingId}</strong>
            <p>{listing ? `${listing.neighborhood} — ${formatKz(listing.price)}` : 'Anúncio'}</p>
            <p className="staff-inquiry-msg">{last.text}</p>
            <small>
              {last.author} • {formatStaffDate(last.at)} • {messages.length} mensagem(ns)
            </small>
          </div>
          <div className="admin-actions">
            {listing ? (
              <>
                <Link className="button primary" to={`/anuncio/${listing.id}#contactar`}>
                  Ver anúncio
                </Link>
                {listing.phone ? (
                  <a className="button filter-button" href={`tel:${listing.phone}`}>
                    Ligar
                  </a>
                ) : null}
                <Link className="button ghost" to="/painel">
                  Painel senhorio
                </Link>
              </>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}
