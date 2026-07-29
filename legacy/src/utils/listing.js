import { isListingPublic, normalizeListingStatus } from '../constants/listingStatus'

export function normalizeListing(raw) {
  if (!raw) return null
  return {
    id: raw.id,
    slug: raw.slug || raw.id,
    reference: raw.reference || raw.id?.toUpperCase(),
    category: raw.category,
    operation: raw.operation,
    status: normalizeListingStatus(raw.listingStatus || raw.status),
    title: raw.title,
    description: raw.description || '',
    pricing: { amount: Number(raw.price || 0), currency: 'AOA' },
    price: raw.price,
    location: {
      province: raw.province,
      municipality: raw.municipality,
      neighborhood: raw.neighborhood,
      lat: raw.lat,
      lng: raw.lng,
    },
    media: {
      photos: raw.photos?.length ? raw.photos : [],
      videos: raw.videos || [],
    },
    features: raw.features || buildDefaultFeatures(raw),
    amenities: raw.amenities || [],
    rules: raw.rules || [],
    documentation: raw.documentation || [],
    owner: {
      name: raw.ownerName,
      type: raw.ownerType,
      phone: raw.phone,
      email: raw.ownerEmail || raw.email || '',
      verified: Boolean(raw.verifiedProfile),
      memberSince: raw.ownerSince || raw.createdAt,
      avatar: raw.ownerAvatar || '',
    },
    verification: {
      profile: raw.verifiedProfile,
      phone: raw.verifiedPhone,
      document: raw.verifiedDocument,
      seal: raw.trustSeal,
    },
    badges: raw.badges || buildBadges(raw),
    analytics: {
      views: raw.views ?? 0,
      favorites: raw.favoritesCount ?? 0,
    },
    publishedAt: raw.publishedAt || raw.approvedAt || raw.createdAt,
    updatedAt: raw.updatedAt || raw.createdAt,
    propertyType: raw.propertyType,
    bedrooms: raw.bedrooms,
    bathrooms: raw.bathrooms,
    area: raw.area,
    brand: raw.brand,
    model: raw.model,
    year: raw.year,
    mileage: raw.mileage,
    fuel: raw.fuel,
    gearbox: raw.gearbox,
    condition: raw.condition,
    featured: raw.featured,
    trustSeal: raw.trustSeal,
    photos: raw.photos,
    province: raw.province,
    municipality: raw.municipality,
    neighborhood: raw.neighborhood,
    phone: raw.phone,
    ownerName: raw.ownerName,
    ownerType: raw.ownerType,
    verifiedProfile: raw.verifiedProfile,
    verifiedPhone: raw.verifiedPhone,
    verifiedDocument: raw.verifiedDocument,
    statusLegacy: raw.status,
  }
}

function buildBadges(raw) {
  const badges = []
  if (raw.isDemo) badges.push('Demo')
  if (raw.featured) badges.push('Destaque')
  if (!raw.isDemo && raw.verifiedDocument) badges.push('Verificado')
  if (raw.condition === 'Novo') badges.push('Novo')
  return badges
}

function buildDefaultFeatures(raw) {
  if (raw.category === 'Veículo') {
    return [
      { label: 'Marca', value: raw.brand },
      { label: 'Modelo', value: raw.model },
      { label: 'Ano', value: raw.year },
      { label: 'Quilometragem', value: raw.mileage ? `${raw.mileage} km` : '—' },
      { label: 'Combustível', value: raw.fuel },
      { label: 'Caixa', value: raw.gearbox },
      { label: 'Estado', value: raw.condition },
    ].filter((item) => item.value)
  }
  return [
    { label: 'Tipo', value: raw.propertyType },
    { label: 'Quartos', value: raw.bedrooms },
    { label: 'Casas de banho', value: raw.bathrooms },
    { label: 'Área', value: raw.area ? `${raw.area} m²` : '—' },
    { label: 'Operação', value: raw.operation },
  ].filter((item) => item.value !== undefined && item.value !== '')
}

export function getSimilarListings(listings, current, limit = 4) {
  return listings
    .filter(
      (item) =>
        item.id !== current.id &&
        item.category === current.category &&
        (item.status === 'Ativo' || isListingPublic(item.listingStatus || item.status)),
    )
    .map((item) => ({ item, score: scoreSimilarity(item, current) }))
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
    .slice(0, limit)
}

function scoreSimilarity(item, current) {
  let score = 0
  if (item.operation === current.operation) score += 4
  if (item.province === current.province) score += 3
  if (item.municipality === current.municipality) score += 2
  if (item.neighborhood === current.neighborhood) score += 1
  if (item.propertyType && item.propertyType === current.propertyType) score += 2
  if (item.category === 'Veículo' && item.brand && item.brand === current.brand) score += 2
  if (item.featured) score += 1
  return score
}
