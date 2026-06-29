import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { ContactCard } from '../components/shared/ContactCard'
import { ImageGallery } from '../components/shared/ImageGallery'
import { ListingBadgeList } from '../components/shared/ListingBadge'
import { ListingDetailSections } from '../components/shared/ListingDetailSections'
import { MapSection } from '../components/shared/MapSection'
import { SafetyTips } from '../components/shared/SafetyTips'
import { SimilarListings } from '../components/shared/SimilarListings'
import { EmptyState } from '../components/ui/EmptyState'
import { useMarketplace } from '../context/MarketplaceContext'
import { useRequireLogin } from '../hooks/useRequireLogin'
import { AnalyticsEvents, trackEvent } from '../services/analytics'
import { formatKz } from '../utils/format'
import { getSimilarListings, normalizeListing } from '../utils/listing'
import '../styles/listing-detail.css'

export default function ListingDetailPage() {
  const { id } = useParams()
  const {
    getListing,
    listings,
    trackView,
    chatByListing,
    sendChat,
    profile,
    favorites,
    toggleFavorite,
    toggleCompare,
    compare,
    isAdmin,
    isListingOwner,
  } = useMarketplace()
  const rawListing = getListing(id)
  const listing = useMemo(() => normalizeListing(rawListing), [rawListing])
  const navigate = useNavigate()
  const requireLogin = useRequireLogin()
  const [chatInput, setChatInput] = useState('')

  useEffect(() => {
    if (listing && listing.statusLegacy === 'Ativo') {
      trackView(listing.id)
      trackEvent(AnalyticsEvents.VIEW_LISTING, { listingId: listing.id })
    }
  }, [listing, trackView])

  useEffect(() => {
    if (listing) {
      document.title = `${listing.title} | Kuteka`
    }
  }, [listing])

  useEffect(() => {
    if (window.location.hash === '#chat') {
      document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [listing?.id])

  if (!listing) {
    return (
      <main className="page-main">
        <EmptyState
          title="Anúncio não encontrado"
          description="Este anúncio já não está disponível ou foi removido."
          actionLabel="Ver anúncios"
          actionTo="/comprar"
        />
      </main>
    )
  }

  if (listing.statusLegacy !== 'Ativo' && !isAdmin && !isListingOwner(rawListing)) {
    return (
      <main className="page-main">
        <EmptyState
          title="Anúncio não disponível"
          description="Este anúncio ainda não foi publicado."
          actionLabel="Ver anúncios activos"
          actionTo="/comprar"
        />
      </main>
    )
  }

  if (listing.statusLegacy !== 'Ativo' && isListingOwner(rawListing)) {
    return <Navigate to={`/publicar/enviado/${listing.id}`} replace />
  }

  const messages = chatByListing[listing.id] || []
  const similar = getSimilarListings(listings, rawListing)

  function handleSendChat() {
    if (!requireLogin(undefined, `${window.location.pathname}#chat`)) return
    if (!chatInput.trim()) return
    trackEvent(AnalyticsEvents.CONTACT_OWNER, { listingId: listing.id, channel: 'chat' })
    sendChat(listing.id, chatInput, profile.name)
    setChatInput('')
  }

  function handleFavorite() {
    toggleFavorite(listing.id)
    trackEvent(AnalyticsEvents.SAVE_FAVORITE, { listingId: listing.id })
  }

  return (
    <main className="page-main listing-detail-page">
      <CatalogBreadcrumbs
        items={[
          { label: 'Início', to: '/inicio' },
          {
            label: listing.category === 'Veículo' ? 'Veículos' : listing.operation,
            to: listing.category === 'Veículo' ? '/veiculos' : '/comprar',
          },
          { label: listing.title, to: `/anuncio/${listing.id}` },
        ]}
      />

      <header className="listing-detail-header">
        <ListingBadgeList badges={listing.badges} />
        <h1>{listing.title}</h1>
        <div className="listing-detail-meta">
          <span>Ref. {listing.reference}</span>
          <span>
            {listing.location.province} / {listing.location.municipality} / {listing.location.neighborhood}
          </span>
          <span>Publicado {listing.publishedAt?.slice(0, 10) || '—'}</span>
          <span>{listing.analytics.views} visualizações</span>
        </div>
        <p className="listing-price-line">{formatKz(listing.price)}</p>
        <button className="text-button back-link" type="button" onClick={() => navigate(-1)}>
          ← Voltar
        </button>
      </header>

      <div className="listing-detail-layout">
        <div className="listing-detail-main">
          <ImageGallery photos={listing.media.photos} title={listing.title} />
          <ListingDetailSections listing={listing} />
          <MapSection location={listing.location} />
          <SafetyTips />
          <SimilarListings
            listings={similar}
            favorites={favorites}
            compare={compare}
            onFavorite={toggleFavorite}
            onCompare={toggleCompare}
          />
        </div>

        <div className="listing-detail-sidebar">
          <ContactCard
            listing={listing}
            isFavorite={favorites.includes(listing.id)}
            verifiedSeal={listing.verification.profile}
            onFavorite={handleFavorite}
            onMessage={() => requireLogin(undefined, `${window.location.pathname}#chat`)}
          />
        </div>
      </div>

      <section className="listing-chat-section panel-card" id="chat">
        <h3>Chat com o anunciante</h3>
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
            aria-label="Mensagem para o anunciante"
          />
          <button className="button primary" type="button" onClick={handleSendChat}>
            Enviar
          </button>
        </div>
      </section>
    </main>
  )
}
