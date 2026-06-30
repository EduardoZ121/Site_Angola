import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { ListingDetailCrossNav } from '../components/listing/ListingDetailCrossNav'
import { ListingDetailMetaStrip } from '../components/listing/ListingDetailMetaStrip'
import { ListingDetailToolbar } from '../components/listing/ListingDetailToolbar'
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
import {
  buildCatalogFiltersLink,
  buildSimilarCatalogLink,
  formatDetailPrice,
  getCatalogLabelForListing,
  getCatalogPathForListing,
} from '../utils/listingDetail'
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
    compare,
    toggleFavorite,
    toggleCompare,
    isAdmin,
    isListingOwner,
  } = useMarketplace()
  const rawListing = getListing(id)
  const listing = useMemo(() => normalizeListing(rawListing), [rawListing])
  const navigate = useNavigate()
  const requireLogin = useRequireLogin()
  const [chatInput, setChatInput] = useState('')
  const [compareNotice, setCompareNotice] = useState('')

  const openChatFromHash =
    typeof window !== 'undefined' &&
    (window.location.hash === '#chat' || window.location.hash === '#contactar')

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
    if (openChatFromHash) {
      document.getElementById('contactar')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [listing?.id, openChatFromHash])

  if (!listing) {
    return (
      <main className="page-main">
        <EmptyState
          title="Anúncio não encontrado"
          description="Este anúncio já não está disponível ou foi removido."
          actionLabel="Explorar marketplace"
          actionTo="/explorar"
        />
      </main>
    )
  }

  const catalogPath = getCatalogPathForListing(listing)
  const catalogLabel = getCatalogLabelForListing(listing)

  if (listing.statusLegacy !== 'Ativo' && !isAdmin && !isListingOwner(rawListing)) {
    return (
      <main className="page-main">
        <EmptyState
          title="Anúncio não disponível"
          description="Este anúncio ainda não foi publicado."
          actionLabel={`Ver ${catalogLabel.toLowerCase()}`}
          actionTo={catalogPath}
        />
      </main>
    )
  }

  if (listing.statusLegacy !== 'Ativo' && isListingOwner(rawListing)) {
    return <Navigate to={`/publicar/enviado/${listing.id}`} replace />
  }

  const messages = chatByListing[listing.id] || []
  const similar = getSimilarListings(listings, rawListing, 4)
  const isFavorite = favorites.includes(listing.id)
  const isCompared = compare.includes(listing.id)
  const compareFull = compare.length >= 3
  const mapFiltersLink = buildCatalogFiltersLink(listing)

  function handleSendChat() {
    if (!requireLogin(undefined, `${window.location.pathname}#contactar`)) return
    if (!chatInput.trim()) return
    trackEvent(AnalyticsEvents.CONTACT_OWNER, { listingId: listing.id, channel: 'chat' })
    sendChat(listing.id, chatInput, profile.name)
    setChatInput('')
  }

  function handleFavorite() {
    if (!requireLogin(undefined, window.location.pathname)) return
    toggleFavorite(listing.id)
    trackEvent(AnalyticsEvents.SAVE_FAVORITE, { listingId: listing.id })
  }

  function handleCompare() {
    if (isCompared) {
      toggleCompare(listing.id)
      setCompareNotice('')
      return
    }
    if (compareFull) {
      setCompareNotice('Já tem 3 anúncios na comparação. Remova um em Comparar.')
      return
    }
    toggleCompare(listing.id)
    setCompareNotice('Adicionado à comparação.')
    window.setTimeout(() => setCompareNotice(''), 2500)
  }

  function scrollToContact() {
    document.getElementById('contactar')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="page-main listing-detail-page">
      <div className="listing-detail-wrap">
        <CatalogBreadcrumbs
          items={[
            { label: 'Início', to: '/inicio' },
            { label: catalogLabel, to: catalogPath },
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
          <p className="listing-price-line">{formatDetailPrice(listing, formatKz)}</p>
          <div className="listing-detail-meta">
            <span>
              {listing.location.neighborhood}, {listing.location.municipality},{' '}
              {listing.location.province}
            </span>
            <span>Ref. {listing.reference}</span>
            {listing.operation === 'Arrendamento' ? <span>Arrendamento mensal</span> : null}
            {listing.category === 'Veículo' ? <span>Venda</span> : null}
          </div>
        </header>

        <ListingDetailToolbar
          listing={listing}
          isFavorite={isFavorite}
          isCompared={isCompared}
          compareFull={compareFull}
          onFavorite={handleFavorite}
          onCompare={handleCompare}
          onContact={scrollToContact}
        />
        {compareNotice ? <p className="listing-detail-notice">{compareNotice}</p> : null}

        <ListingDetailMetaStrip listing={listing} />

        <ListingDetailSections listing={listing} compact />

        <MapSection location={listing.location} filtersLink={mapFiltersLink} />

        <ListingContactSection
          listing={listing}
          messages={messages}
          chatInput={chatInput}
          onChatInput={setChatInput}
          onSendChat={handleSendChat}
          onMessageFocus={() => requireLogin(undefined, `${window.location.pathname}#contactar`)}
          isFavorite={isFavorite}
          onFavorite={handleFavorite}
          verifiedSeal={listing.verification.profile}
          initialChatOpen={openChatFromHash}
        />

        <SimilarListings listings={similar.slice(0, 3)} seeAllLink={buildSimilarCatalogLink(listing)} />

        <ListingDetailCrossNav listing={listing} />
      </div>
    </main>
  )
}
