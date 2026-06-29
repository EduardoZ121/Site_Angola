export const CATALOG_PAGE_SIZE = 12

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Mais recentes' },
  { value: 'price-asc', label: 'Menor preço' },
  { value: 'price-desc', label: 'Maior preço' },
  { value: 'featured', label: 'Destaques' },
]

export function sortListings(listings, sort = 'recent') {
  const items = [...listings]
  switch (sort) {
    case 'price-asc':
      return items.sort((a, b) => Number(a.price) - Number(b.price))
    case 'price-desc':
      return items.sort((a, b) => Number(b.price) - Number(a.price))
    case 'featured':
      return items.sort(
        (a, b) => Number(b.featured) - Number(a.featured) || Number(b.price) - Number(a.price),
      )
    case 'recent':
    default:
      return items.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      )
  }
}

export function paginateListings(listings, page = 1, pageSize = CATALOG_PAGE_SIZE) {
  const safePage = Math.max(1, Number(page) || 1)
  const start = (safePage - 1) * pageSize
  return {
    items: listings.slice(start, start + pageSize),
    page: safePage,
    totalPages: Math.max(1, Math.ceil(listings.length / pageSize)),
    total: listings.length,
  }
}
