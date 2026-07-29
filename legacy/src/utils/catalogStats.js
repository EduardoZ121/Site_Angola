export function countCatalogByPropertyType(listings = [], { operation = 'Venda', category = 'Imóvel' } = {}) {
  const active = listings.filter(
    (item) => item.status === 'Ativo' && item.operation === operation && item.category === category,
  )
  const counts = { Todos: active.length }
  active.forEach((item) => {
    const type = item.propertyType || 'Outro'
    counts[type] = (counts[type] || 0) + 1
  })
  return counts
}

export function computeCatalogPriceInsight(listings = []) {
  if (!listings.length) return null
  const prices = listings.map((item) => Number(item.price)).filter((value) => value > 0)
  if (!prices.length) return null
  const sum = prices.reduce((acc, value) => acc + value, 0)
  return {
    avg: Math.round(sum / prices.length),
    min: Math.min(...prices),
    max: Math.max(...prices),
  }
}
