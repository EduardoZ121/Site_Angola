import { LISTING_STATUS } from '../constants/listingStatus'
import { getCategoryConfig, isPropertyWithRooms, isVehicleCategory } from '../constants/publishCategories'
import { trustSealFromProfile } from './format'

export const PUBLISH_DRAFT_KEY = 'kuteka.market.publishDraft'

export function createEmptyPublishDraft() {
  return {
    step: 0,
    listingCategory: '',
    category: 'Imóvel',
    operation: 'Arrendamento',
    propertyType: 'Apartamento',
    title: '',
    description: '',
    price: '',
    province: 'Luanda',
    municipality: 'Talatona',
    neighborhood: 'Cidade Financeira',
    lat: '',
    lng: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    brand: '',
    model: '',
    year: '',
    mileage: '',
    fuel: 'Gasolina',
    gearbox: 'Automática',
    condition: 'Semi-novo',
    amenities: [],
    rules: [],
    photos: [],
    coverIndex: 0,
    contactPhone: '',
    useProfilePhone: true,
    lastSavedAt: null,
  }
}

export function readPublishDraft() {
  try {
    const raw = localStorage.getItem(PUBLISH_DRAFT_KEY)
    if (!raw) return createEmptyPublishDraft()
    return { ...createEmptyPublishDraft(), ...JSON.parse(raw) }
  } catch {
    return createEmptyPublishDraft()
  }
}

export function writePublishDraft(draft) {
  localStorage.setItem(PUBLISH_DRAFT_KEY, JSON.stringify({ ...draft, lastSavedAt: new Date().toISOString() }))
}

export function clearPublishDraft() {
  localStorage.removeItem(PUBLISH_DRAFT_KEY)
}

export function validatePublishStep(stepId, draft) {
  const errors = []
  switch (stepId) {
    case 'category':
      if (!draft.listingCategory) errors.push('Seleccione uma categoria.')
      break
    case 'basic':
      if (!draft.title?.trim()) errors.push('Indique um título.')
      if (!draft.description?.trim()) errors.push('Escreva uma descrição.')
      if (!draft.operation) errors.push('Seleccione a operação.')
      break
    case 'location':
      if (!draft.province) errors.push('Seleccione a província.')
      if (!draft.municipality) errors.push('Seleccione o município.')
      if (!draft.neighborhood) errors.push('Seleccione o bairro.')
      break
    case 'features':
      if (isPropertyWithRooms(draft.listingCategory)) {
        if (!draft.bedrooms && draft.bedrooms !== 0) errors.push('Indique o número de quartos.')
        if (!draft.bathrooms && draft.bathrooms !== 0) errors.push('Indique casas de banho.')
      }
      if (draft.listingCategory === 'Terreno' && !draft.area) errors.push('Indique a área em m².')
      if (isVehicleCategory(draft.listingCategory)) {
        if (!draft.brand?.trim()) errors.push('Indique a marca.')
        if (!draft.model?.trim()) errors.push('Indique o modelo.')
        if (!draft.year) errors.push('Indique o ano.')
      }
      break
    case 'media':
      if (!draft.photos?.length) errors.push('Adicione pelo menos uma fotografia.')
      break
    case 'pricing':
      if (!draft.price || Number(draft.price) <= 0) errors.push('Indique um preço válido em Kz.')
      break
    case 'contact':
      if (!draft.useProfilePhone && !draft.contactPhone?.trim()) errors.push('Indique um telefone de contacto.')
      break
    default:
      break
  }
  return errors
}

export function draftCompletionPercent(draft) {
  const checks = [
    Boolean(draft.listingCategory),
    Boolean(draft.title?.trim() && draft.description?.trim()),
    Boolean(draft.province && draft.municipality && draft.neighborhood),
    validatePublishStep('features', draft).length === 0 || !draft.listingCategory,
    Boolean(draft.photos?.length),
    Boolean(draft.price && Number(draft.price) > 0),
    draft.useProfilePhone || Boolean(draft.contactPhone?.trim()),
  ]
  const done = checks.filter(Boolean).length
  return Math.round((done / checks.length) * 100)
}

export function applyCategoryToDraft(draft, listingCategory) {
  const config = getCategoryConfig(listingCategory)
  return {
    ...draft,
    listingCategory,
    category: config.category,
    propertyType: config.propertyType,
  }
}

export function draftToRawListing(draft, profile) {
  const config = getCategoryConfig(draft.listingCategory)
  const photos = [...(draft.photos || [])]
  if (draft.coverIndex > 0 && photos[draft.coverIndex]) {
    const cover = photos.splice(draft.coverIndex, 1)[0]
    photos.unshift(cover)
  }

  const phone = draft.useProfilePhone ? profile.phone : draft.contactPhone
  const base = {
    id: `l-${Date.now()}`,
    category: config.category,
    operation: draft.operation,
    title: draft.title.trim(),
    price: Number(draft.price),
    province: draft.province,
    municipality: draft.municipality,
    neighborhood: draft.neighborhood,
    ownerName: profile.name,
    ownerEmail: profile.email || '',
    ownerType: profile.type,
    phone,
    verifiedProfile: profile.verifiedProfile,
    verifiedPhone: profile.verifiedPhone,
    verifiedDocument: profile.verifiedDocument,
    trustSeal: trustSealFromProfile(profile),
    status: 'Pendente',
    listingStatus: LISTING_STATUS.UNDER_REVIEW,
    featured: false,
    description: draft.description.trim(),
    photos,
    amenities: draft.amenities || [],
    rules: draft.rules || [],
    lat: draft.lat ? Number(draft.lat) : Number((Math.random() * 0.85 + 0.08).toFixed(2)),
    lng: draft.lng ? Number(draft.lng) : Number((Math.random() * 0.85 + 0.08).toFixed(2)),
    createdAt: new Date().toISOString().slice(0, 10),
    submittedAt: new Date().toISOString(),
    propertyType: config.propertyType,
  }

  if (config.category === 'Imóvel') {
    return {
      ...base,
      bedrooms: Number(draft.bedrooms || 0),
      bathrooms: Number(draft.bathrooms || 0),
      area: Number(draft.area || 0),
    }
  }

  return {
    ...base,
    brand: draft.brand,
    model: draft.model,
    year: Number(draft.year || 0),
    mileage: Number(draft.mileage || 0),
    fuel: draft.fuel,
    gearbox: draft.gearbox,
    condition: draft.condition,
  }
}
