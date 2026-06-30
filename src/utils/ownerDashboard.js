export const OWNER_CROSS_LINKS = [
  { to: '/publicar', label: 'Publicar', icon: 'edit' },
  { to: '/precos', label: 'Preços por zona', icon: 'chart' },
  { to: '/destaques', label: 'Planos destaque', icon: 'bolt' },
  { to: '/conta', label: 'Minha conta', icon: 'user' },
]

const MIN_PHOTOS_RECOMMENDED = 4

export function computeOwnerInsights(listings = [], stats = {}) {
  const items = []

  if (stats.rejected > 0) {
    items.push({
      id: 'rejected',
      tone: 'danger',
      label: `${stats.rejected} rejeitado${stats.rejected > 1 ? 's' : ''}`,
      detail: 'Corrija e reenvie para revisão',
      filterId: 'Rejeitado',
    })
  }

  if (stats.pending > 0) {
    items.push({
      id: 'pending',
      tone: 'warning',
      label: `${stats.pending} em revisão`,
      detail: 'Aguarde aprovação da equipa Kuteka',
      filterId: 'Pendente',
    })
  }

  const lowPhotoListings = listings.filter(
    (listing) =>
      listing.status === 'Ativo' && (listing.photos?.length || 0) < MIN_PHOTOS_RECOMMENDED,
  )
  if (lowPhotoListings.length) {
    items.push({
      id: 'photos',
      tone: 'info',
      label: `${lowPhotoListings.length} com poucas fotos`,
      detail: `Recomendamos pelo menos ${MIN_PHOTOS_RECOMMENDED} fotos por anúncio`,
      listingId: lowPhotoListings[0].id,
    })
  }

  if (stats.paused > 0) {
    items.push({
      id: 'paused',
      tone: 'muted',
      label: `${stats.paused} pausado${stats.paused > 1 ? 's' : ''}`,
      detail: 'Reactivar para voltar a receber contactos',
      filterId: 'Pausado',
    })
  }

  return items
}

export function getNotificationTarget(notification) {
  if (!notification) return '/conta#mensagens'

  const listingId = notification.listingId
  const type = notification.type || ''

  if (type === 'listing_rejected' && listingId) return `/painel/editar/${listingId}`
  if (type === 'listing_approved' && listingId) return `/anuncio/${listingId}`
  if ((type === 'listing_pending' || type === 'featured_renewed') && listingId) {
    return `/publicar/enviado/${listingId}`
  }
  if (listingId) return '/painel#anuncios'

  return '/conta#mensagens'
}

export function canOwnerDeleteListing(listing) {
  if (!listing) return false
  return listing.status === 'Rejeitado' || listing.status === 'Pausado'
}
