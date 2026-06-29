import { LISTING_STATUS, normalizeListingStatus } from '../constants/listingStatus'

export const OWNER_STATUS_LABELS = {
  Ativo: 'Publicado',
  Pendente: 'Em revisão',
  Pausado: 'Pausado',
  Rejeitado: 'Rejeitado',
  [LISTING_STATUS.DRAFT]: 'Rascunho',
  [LISTING_STATUS.UNDER_REVIEW]: 'Em revisão',
  [LISTING_STATUS.PUBLISHED]: 'Publicado',
  [LISTING_STATUS.ACTIVE]: 'Publicado',
  [LISTING_STATUS.REJECTED]: 'Rejeitado',
  [LISTING_STATUS.ARCHIVED]: 'Arquivado',
}

export function getOwnerStatusLabel(listing) {
  if (listing.status && OWNER_STATUS_LABELS[listing.status]) {
    return OWNER_STATUS_LABELS[listing.status]
  }
  const normalized = normalizeListingStatus(listing.listingStatus || listing.status)
  return OWNER_STATUS_LABELS[normalized] || listing.status || '—'
}

export function getOwnerStatusTone(listing) {
  const status = listing.status || normalizeListingStatus(listing.listingStatus)
  if (status === 'Ativo' || status === LISTING_STATUS.ACTIVE || status === LISTING_STATUS.PUBLISHED) {
    return 'active'
  }
  if (status === 'Pendente' || status === LISTING_STATUS.UNDER_REVIEW) return 'pending'
  if (status === 'Pausado' || status === LISTING_STATUS.ARCHIVED) return 'paused'
  if (status === 'Rejeitado' || status === LISTING_STATUS.REJECTED) return 'rejected'
  return 'default'
}

export function computeOwnerStats(listings, favorites = []) {
  return {
    total: listings.length,
    active: listings.filter((item) => item.status === 'Ativo').length,
    pending: listings.filter((item) => item.status === 'Pendente').length,
    paused: listings.filter((item) => item.status === 'Pausado').length,
    rejected: listings.filter((item) => item.status === 'Rejeitado').length,
    featured: listings.filter((item) => item.featured).length,
    totalViews: listings.reduce((sum, item) => sum + (item.views || 0), 0),
    totalFavorites: listings.reduce(
      (sum, item) => sum + (favorites.includes(item.id) ? 1 : 0),
      0,
    ),
  }
}

export function rawListingToPublishDraft(listing) {
  const categoryMap = {
    Apartamento: 'Apartamento',
    Vivenda: 'Casa',
    Quarto: 'Quarto',
    Terreno: 'Terreno',
    Loja: 'Loja',
    Escritório: 'Escritorio',
    Armazém: 'Armazem',
    Veículo: 'Veiculo',
  }
  const listingCategory =
    listing.category === 'Veículo'
      ? 'Veiculo'
      : categoryMap[listing.propertyType] || 'Apartamento'

  return {
    step: 0,
    listingCategory,
    category: listing.category,
    operation: listing.operation,
    propertyType: listing.propertyType,
    title: listing.title || '',
    description: listing.description || '',
    price: String(listing.price || ''),
    province: listing.province || 'Luanda',
    municipality: listing.municipality || 'Talatona',
    neighborhood: listing.neighborhood || '',
    lat: listing.lat ? String(listing.lat) : '',
    lng: listing.lng ? String(listing.lng) : '',
    bedrooms: listing.bedrooms != null ? String(listing.bedrooms) : '',
    bathrooms: listing.bathrooms != null ? String(listing.bathrooms) : '',
    area: listing.area != null ? String(listing.area) : '',
    brand: listing.brand || '',
    model: listing.model || '',
    year: listing.year != null ? String(listing.year) : '',
    mileage: listing.mileage != null ? String(listing.mileage) : '',
    fuel: listing.fuel || 'Gasolina',
    gearbox: listing.gearbox || 'Automática',
    condition: listing.condition || 'Semi-novo',
    amenities: listing.amenities || [],
    rules: listing.rules || [],
    photos: listing.photos || [],
    coverIndex: 0,
    contactPhone: listing.phone || '',
    useProfilePhone: true,
    lastSavedAt: null,
  }
}
