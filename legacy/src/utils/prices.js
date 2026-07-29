export const PRICE_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'sale', label: 'À venda' },
  { id: 'rent', label: 'Arrendar' },
  { id: 'vehicle', label: 'Veículos' },
]

export function filterListingsForPriceReport(listings = [], filterId = 'all') {
  const active = listings.filter((item) => item.status === 'Ativo')
  if (filterId === 'sale') {
    return active.filter((item) => item.category === 'Imóvel' && item.operation === 'Venda')
  }
  if (filterId === 'rent') {
    return active.filter((item) => item.operation === 'Arrendamento')
  }
  if (filterId === 'vehicle') {
    return active.filter((item) => item.category === 'Veículo')
  }
  return active
}

export function countPriceFilters(listings = []) {
  const active = listings.filter((item) => item.status === 'Ativo')
  return {
    all: active.length,
    sale: active.filter((item) => item.category === 'Imóvel' && item.operation === 'Venda').length,
    rent: active.filter((item) => item.operation === 'Arrendamento').length,
    vehicle: active.filter((item) => item.category === 'Veículo').length,
  }
}

export function buildZonePriceRows(listings = [], limit = 12) {
  const groups = {}
  listings.forEach((listing) => {
    const zone = `${listing.province} / ${listing.municipality} / ${listing.neighborhood}`
    if (!groups[zone]) {
      groups[zone] = {
        zone,
        province: listing.province,
        municipality: listing.municipality,
        neighborhood: listing.neighborhood,
        prices: [],
      }
    }
    const price = Number(listing.price || 0)
    if (price > 0) groups[zone].prices.push(price)
  })

  return Object.values(groups)
    .filter((group) => group.prices.length > 0)
    .map((group) => {
      const sum = group.prices.reduce((acc, value) => acc + value, 0)
      return {
        zone: group.zone,
        province: group.province,
        municipality: group.municipality,
        neighborhood: group.neighborhood,
        avg: Math.round(sum / group.prices.length),
        min: Math.min(...group.prices),
        max: Math.max(...group.prices),
        count: group.prices.length,
      }
    })
    .sort((a, b) => b.count - a.count || b.avg - a.avg)
    .slice(0, limit)
}

export function computePriceInsight(rows = [], listings = []) {
  const prices = listings.map((item) => Number(item.price)).filter((value) => value > 0)
  if (!prices.length) {
    return { zones: rows.length, avg: null, min: null, max: null, listings: 0 }
  }
  const sum = prices.reduce((acc, value) => acc + value, 0)
  const cheapest = rows.length
    ? rows.reduce((lowest, row) => (row.avg < lowest.avg ? row : lowest), rows[0])
    : null
  return {
    zones: rows.length,
    avg: Math.round(sum / prices.length),
    min: Math.min(...prices),
    max: Math.max(...prices),
    listings: listings.length,
    cheapestZone: cheapest?.zone || null,
  }
}

export function getPriceCatalogBase(filterId = 'all') {
  if (filterId === 'rent') return '/arrendar'
  if (filterId === 'vehicle') return '/veiculos'
  return '/comprar'
}

export function buildZoneCatalogLink(row, filterId = 'all') {
  const base = getPriceCatalogBase(filterId)
  const params = new URLSearchParams()
  if (row.province) params.set('province', row.province)
  if (row.municipality) params.set('municipality', row.municipality)
  if (row.neighborhood) params.set('neighborhood', row.neighborhood)
  const query = params.toString()
  return query ? `${base}?${query}` : base
}
