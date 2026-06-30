export const FAVORITE_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'sale', label: 'À venda' },
  { id: 'rent', label: 'Arrendar' },
  { id: 'vehicle', label: 'Veículos' },
]

export function resolveFavoriteListings(listings = [], favoriteIds = []) {
  return [...favoriteIds]
    .reverse()
    .map((id) => listings.find((listing) => listing.id === id))
    .filter(Boolean)
}

export function filterFavoriteListings(items = [], filterId = 'all') {
  if (filterId === 'sale') {
    return items.filter((item) => item.category === 'Imóvel' && item.operation === 'Venda')
  }
  if (filterId === 'rent') {
    return items.filter((item) => item.category === 'Imóvel' && item.operation === 'Arrendamento')
  }
  if (filterId === 'vehicle') {
    return items.filter((item) => item.category === 'Veículo')
  }
  return items
}

export function countFavoritesByFilter(items = []) {
  return {
    all: items.length,
    sale: items.filter((item) => item.category === 'Imóvel' && item.operation === 'Venda').length,
    rent: items.filter((item) => item.category === 'Imóvel' && item.operation === 'Arrendamento')
      .length,
    vehicle: items.filter((item) => item.category === 'Veículo').length,
  }
}

export function computeFavoritesInsight(items = []) {
  const prices = items.map((item) => Number(item.price)).filter((value) => value > 0)
  return {
    total: items.length,
    properties: items.filter((item) => item.category === 'Imóvel').length,
    vehicles: items.filter((item) => item.category === 'Veículo').length,
    avgPrice: prices.length
      ? Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length)
      : null,
  }
}

export function getStaleFavoriteIds(favoriteIds = [], listings = []) {
  const activeIds = new Set(listings.map((listing) => listing.id))
  return favoriteIds.filter((id) => !activeIds.has(id))
}

export function sortFavoriteListings(items = [], sort = 'recent') {
  const sorted = [...items]
  if (sort === 'price-asc') {
    return sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
  }
  if (sort === 'price-desc') {
    return sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
  }
  return sorted
}
