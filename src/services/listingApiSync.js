import {
  adminPatchListing,
  clearDemoListings,
  createListing,
  deleteListingById,
  fetchAdminListings,
  fetchMyListings,
  getApiToken,
  incrementListingView,
  patchListing,
  restoreDemoListings,
} from '../lib/api'

function mapDraftToApiPayload(raw) {
  return {
    title: raw.title,
    category: raw.category,
    operation: raw.operation,
    propertyType: raw.propertyType,
    price: raw.price,
    province: raw.province,
    municipality: raw.municipality,
    neighborhood: raw.neighborhood,
    description: raw.description,
    photos: raw.photos,
    phone: raw.phone,
    bedrooms: raw.bedrooms,
    bathrooms: raw.bathrooms,
    area: raw.area,
    amenities: raw.amenities,
    rules: raw.rules,
    brand: raw.brand,
    model: raw.model,
    year: raw.year,
    mileage: raw.mileage,
    fuel: raw.fuel,
    gearbox: raw.gearbox,
    condition: raw.condition,
    lat: raw.lat,
    lng: raw.lng,
  }
}

export function canUseListingApi() {
  return Boolean(getApiToken())
}

export async function apiCreateListingFromDraft(raw) {
  const { listing } = await createListing(mapDraftToApiPayload(raw))
  return listing
}

export async function apiSyncPatchListing(id, patch, notifyOwner = false) {
  if (!canUseListingApi()) return null
  try {
    const { listing } = await patchListing(id, patch, notifyOwner)
    return listing
  } catch {
    return null
  }
}

export async function apiSyncDeleteListing(id) {
  if (!canUseListingApi()) return false
  try {
    await deleteListingById(id)
    return true
  } catch {
    return false
  }
}

export async function apiSyncTrackView(id) {
  try {
    await incrementListingView(id)
    return true
  } catch {
    return false
  }
}

export async function apiLoadAdminListings() {
  if (!canUseListingApi()) return null
  try {
    const { listings } = await fetchAdminListings()
    return listings
  } catch {
    return null
  }
}

export async function apiLoadMyListings() {
  if (!canUseListingApi()) return null
  try {
    const { listings } = await fetchMyListings()
    return listings
  } catch {
    return null
  }
}

export async function apiAdminUpdateListing(id, patch) {
  if (!canUseListingApi()) return null
  try {
    const { listing } = await adminPatchListing(id, patch)
    return listing
  } catch {
    return null
  }
}

export async function apiClearDemoListings() {
  if (!canUseListingApi()) return null
  return clearDemoListings()
}

export async function apiRestoreDemoListings() {
  if (!canUseListingApi()) return null
  return restoreDemoListings()
}