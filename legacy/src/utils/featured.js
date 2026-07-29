import { countFavoritesByFilter, filterFavoriteListings } from './favorites'

export const FEATURED_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'sale', label: 'À venda' },
  { id: 'rent', label: 'Arrendar' },
  { id: 'vehicle', label: 'Veículos' },
]

export function getFeaturedListings(listings = []) {
  return listings.filter((item) => item.status === 'Ativo' && item.featured)
}

export function countFeaturedByFilter(items = []) {
  return countFavoritesByFilter(items)
}

export function filterFeaturedListings(items = [], filterId = 'all') {
  return filterFavoriteListings(items, filterId)
}

export function sortFeaturedListings(items = [], sort = 'views') {
  const sorted = [...items]
  if (sort === 'price-asc') {
    return sorted.sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
  }
  if (sort === 'price-desc') {
    return sorted.sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
  }
  if (sort === 'recent') {
    return sorted.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    )
  }
  return sorted.sort((a, b) => (b.views || 0) - (a.views || 0))
}

export function computeFeaturedInsight(items = []) {
  const prices = items.map((item) => Number(item.price)).filter((value) => value > 0)
  return {
    total: items.length,
    properties: items.filter((item) => item.category === 'Imóvel').length,
    vehicles: items.filter((item) => item.category === 'Veículo').length,
    totalViews: items.reduce((sum, item) => sum + (item.views || 0), 0),
    avgPrice: prices.length
      ? Math.round(prices.reduce((sum, value) => sum + value, 0) / prices.length)
      : null,
  }
}

export function getFeaturedCatalogLink(filterId = 'all') {
  if (filterId === 'rent') return '/arrendar'
  if (filterId === 'vehicle') return '/veiculos'
  if (filterId === 'sale') return '/comprar'
  return '/explorar'
}
