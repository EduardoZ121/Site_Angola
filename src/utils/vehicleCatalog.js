const PICKUP_PATTERN =
  /pickup|hilux|prado|land cruiser|landcruiser|suv|ranger|amarok|l200|navara|pathfinder|4x4|fortuner|pajero|d-max|dmax|everest|x-trail|xtrail|tucson|sportage/i

export function getVehicleSegment(listing) {
  if (listing?.category !== 'Veículo') return null
  const haystack = `${listing.title || ''} ${listing.model || ''} ${listing.description || ''}`
  return PICKUP_PATTERN.test(haystack) ? 'Pickup' : 'Carro'
}

export function matchesVehicleTypeFilter(listing, propertyType) {
  if (propertyType === 'Todos') return true
  if (listing.category !== 'Veículo') return listing.propertyType === propertyType
  if (propertyType === 'Veículo') return true
  return getVehicleSegment(listing) === propertyType
}

export function countVehicleBySegment(listings = []) {
  const active = listings.filter((item) => item.status === 'Ativo' && item.category === 'Veículo')
  const counts = { Todos: active.length, Carro: 0, Pickup: 0 }
  active.forEach((item) => {
    const segment = getVehicleSegment(item)
    counts[segment] = (counts[segment] || 0) + 1
  })
  return counts
}
