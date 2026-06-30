import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { ImageGallery } from '../components/shared/ImageGallery'
import { ListingBadgeList } from '../components/shared/ListingBadge'
import { ListingContactSection } from '../components/shared/ListingContactSection'
import { ListingDetailSections } from '../components/shared/ListingDetailSections'
import { MapSection } from '../components/shared/MapSection'
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
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [id])

  useEffect(() => {
    if (window.location.hash === '#chat' || window.location.hash === '#contactar') {
      document.getElementById('contactar')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [listing?.id])

  if (!listing) {
    return (
      <main className="page-main">
        <EmptyState
          title="Anúncio não encontrado"
          description="Este anúncio já não está disponível ou foi removido."
          actionLabel="Ver anúncios"
          actionTo="/arrendar"
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
          actionTo="/arrendar"
        />
      </main>
    )
  }

  if (listing.statusLegacy !== 'Ativo' && isListingOwner(rawListing)) {
    return <Navigate to={`/publicar/enviado/${listing.id}`} replace />
  }

  const messages = chatByListing[listing.id] || []
  const similar = getSimilarListings(listings, rawListing, 4)

  function handleSendChat() {
    if (!requireLogin(undefined, `${window.location.pathname}#contactar`)) return
    if (!chatInput.trim()) return
    trackEvent(AnalyticsEvents.CONTACT_OWNER, { listingId: listing.id, channel: 'chat' })
    sendChat(listing.id, chatInput, profile.name)
    setChatInput('')
  }

  function handleFavorite() {
    toggleFavorite(listing.id)
    trackEvent(AnalyticsEvents.SAVE_FAVORITE, { listingId: listing.id })
  }

  const catalogPath =
    listing.category === 'Veículo'
      ? '/veiculos'
      : listing.operation === 'Arrendamento'
        ? '/arrendar'
        : '/comprar'

  return (
    <main className="page-main listing-detail-page">
      <div className="listing-detail-wrap">
        <CatalogBreadcrumbs
          items={[
            { label: 'Início', to: '/inicio' },
            {
              label: listing.category === 'Veículo' ? 'Veículos' : listing.operation === 'Arrendamento' ? 'Arrendar' : 'Comprar',
              to: catalogPath,
            },
            { label: listing.title, to: `/anuncio/${listing.id}` },
          ]}
        />

        <button className="listing-detail-back" type="button" onClick={() => navigate(-1)}>
          ← Voltar
        </button>

        <ImageGallery photos={listing.media.photos} title={listing.title} />

        <header className="listing-detail-header">
          <ListingBadgeList badges={listing.badges} />
          <h1>{listing.title}</h1>
          <p className="listing-price-line">{formatKz(listing.price)}</p>
          <div className="listing-detail-meta">
            <span>{listing.location.municipality}, {listing.location.province}</span>
            <span>Ref. {listing.reference}</span>
            {listing.operation === 'Arrendamento' ? <span>Arrendamento mensal</span> : null}
          </div>
        </header>

        <ListingDetailSections listing={listing} compact />

        <MapSection location={listing.location} />

        <ListingContactSection
          listing={listing}
          messages={messages}
          chatInput={chatInput}
          onChatInput={setChatInput}
          onSendChat={handleSendChat}
          onMessageFocus={() => requireLogin(undefined, `${window.location.pathname}#contactar`)}
          isFavorite={favorites.includes(listing.id)}
          onFavorite={handleFavorite}
          verifiedSeal={listing.verification.profile}
        />

        <SimilarListings listings={similar.slice(0, 3)} />
      </div>
    </main>
  )
}
