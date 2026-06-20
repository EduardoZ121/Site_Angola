import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { defaultPhoto } from '../data/constants'
import { useMarketplace } from '../context/MarketplaceContext'
import { TrustBadge } from '../components/ui'
import { formatKz, whatsappLink } from '../utils/format'

export default function ListingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    getListing,
    trackView,
    chatByListing,
    sendChat,
    profile,
    favorites,
    toggleFavorite,
    toggleCompare,
    compare,
  } = useMarketplace()
  const listing = getListing(id)
  const [chatInput, setChatInput] = useState('')

  useEffect(() => {
    if (listing) trackView(listing.id)
  }, [listing, trackView])

  if (!listing) {
    return (
      <main className="page-main">
        <section className="section page-section empty-state">
          <h1>Anúncio não encontrado</h1>
          <Link className="button primary" to="/comprar">
            Ver anúncios
          </Link>
        </section>
      </main>
    )
  }

  const messages = chatByListing[listing.id] || []

  function handleSendChat() {
    if (!chatInput.trim()) return
    sendChat(listing.id, chatInput, profile.name)
    setChatInput('')
  }

  return (
    <main className="page-main">
      <section className="section page-section detail-page">
        <button className="text-button back-link" type="button" onClick={() => navigate(-1)}>
          ← Voltar
        </button>

        <div className="detail-layout">
          <img src={listing.photos?.[0] || defaultPhoto} alt={listing.title} className="detail-photo" />

          <div className="detail-content">
            <div className="listing-meta">
              <span>{listing.category}</span>
              <span>{listing.operation}</span>
              <TrustBadge listing={listing} />
            </div>
            <h1>{listing.title}</h1>
            <p>
              {listing.province} / {listing.municipality} / {listing.neighborhood}
            </p>
            <strong className="detail-price">{formatKz(listing.price)}</strong>

            {listing.category === 'Imóvel' ? (
              <div className="detail-grid">
                <span>{listing.propertyType}</span>
                <span>{listing.bedrooms} quartos</span>
                <span>{listing.bathrooms} WC</span>
                <span>{listing.area} m²</span>
              </div>
            ) : (
              <div className="detail-grid">
                <span>
                  {listing.brand} {listing.model}
                </span>
                <span>{listing.year}</span>
                <span>{listing.mileage} km</span>
                <span>
                  {listing.fuel} • {listing.gearbox}
                </span>
              </div>
            )}

            <p>{listing.description}</p>
            <p className="owner-line">
              {listing.ownerType} • {listing.ownerName}
            </p>

            <div className="listing-actions">
              <a href={`tel:${listing.phone}`}>Ligar</a>
              <a href={whatsappLink(listing)} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
              <button className="text-button" type="button" onClick={() => toggleFavorite(listing.id)}>
                {favorites.includes(listing.id) ? 'Remover favorito' : 'Favoritar'}
              </button>
              <button className="text-button" type="button" onClick={() => toggleCompare(listing.id)}>
                {compare.includes(listing.id) ? 'Remover comparação' : 'Comparar'}
              </button>
            </div>

            <div className="chat-panel">
              <h2>Chat com o anunciante</h2>
              <div className="chat-box">
                {messages.length === 0 ? (
                  <p>Inicie uma conversa com o anunciante.</p>
                ) : (
                  messages.map((message, index) => (
                    <p key={`${listing.id}-${index}`}>
                      <strong>{message.who}</strong> ({message.at}): {message.text}
                    </p>
                  ))
                )}
              </div>
              <div className="chat-input-row">
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Escrever mensagem..."
                />
                <button className="button primary" type="button" onClick={handleSendChat}>
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
