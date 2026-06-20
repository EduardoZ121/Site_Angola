export function parseStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function trustSealFromProfile(profile) {
  if (profile.verifiedProfile && profile.verifiedPhone) {
    return profile.verifiedDocument ? 'Ouro' : 'Prata'
  }
  return 'Sem selo'
}

export function formatKz(value) {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export function whatsappLink(listing) {
  const phone = String(listing.phone || '').replace(/\D/g, '')
  const message = encodeURIComponent(`Olá, tenho interesse no anúncio: ${listing.title}`)
  return `https://wa.me/${phone}?text=${message}`
}

export function filterListings(listings, filters, isAdmin = false) {
  return listings.filter((listing) => {
    const search = `${listing.title} ${listing.neighborhood} ${listing.municipality} ${listing.province} ${listing.description}`.toLowerCase()
    if (filters.query && !search.includes(filters.query.toLowerCase())) return false
    if (filters.category !== 'Todos' && listing.category !== filters.category) return false
    if (filters.operation !== 'Todos' && listing.operation !== filters.operation) return false
    if (filters.province !== 'Todos' && listing.province !== filters.province) return false
    if (filters.municipality !== 'Todos' && listing.municipality !== filters.municipality) return false
    if (filters.neighborhood !== 'Todos' && listing.neighborhood !== filters.neighborhood) return false
    if (filters.minPrice && Number(listing.price) < Number(filters.minPrice)) return false
    if (filters.maxPrice && Number(listing.price) > Number(filters.maxPrice)) return false
    if (listing.category === 'Veículo') {
      if (filters.brand && !String(listing.brand || '').toLowerCase().includes(filters.brand.toLowerCase())) return false
      if (filters.model && !String(listing.model || '').toLowerCase().includes(filters.model.toLowerCase())) return false
      if (filters.yearMin && Number(listing.year || 0) < Number(filters.yearMin)) return false
      if (filters.yearMax && Number(listing.year || 0) > Number(filters.yearMax)) return false
      if (filters.mileageMax && Number(listing.mileage || 0) > Number(filters.mileageMax)) return false
      if (filters.fuel !== 'Todos' && listing.fuel !== filters.fuel) return false
      if (filters.gearbox !== 'Todos' && listing.gearbox !== filters.gearbox) return false
      if (filters.condition !== 'Todos' && listing.condition !== filters.condition) return false
    }
    return listing.status !== 'Pausado' || isAdmin
  })
}

export function zoneAverages(listings) {
  const groups = {}
  listings.forEach((listing) => {
    const key = `${listing.province} / ${listing.municipality} / ${listing.neighborhood}`
    groups[key] = groups[key] || { total: 0, count: 0 }
    groups[key].total += Number(listing.price || 0)
    groups[key].count += 1
  })
  return Object.entries(groups)
    .map(([zone, stats]) => ({
      zone,
      avg: Math.round(stats.total / stats.count),
      count: stats.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
}
