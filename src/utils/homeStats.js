export function computeHomeMarketStats(listings = []) {
  const active = listings.filter((item) => item.status === 'Ativo')
  return {
    totalActive: active.length,
    forSale: active.filter((item) => item.category === 'Imóvel' && item.operation === 'Venda').length,
    forRent: active.filter((item) => item.operation === 'Arrendamento').length,
    vehicles: active.filter((item) => item.category === 'Veículo').length,
    featured: active.filter((item) => item.featured).length,
    provinces: new Set(active.map((item) => item.province).filter(Boolean)).size,
  }
}

export function computeCategoryCounts(listings = []) {
  const active = listings.filter((item) => item.status === 'Ativo')
  return {
    buy: active.filter((item) => item.category === 'Imóvel' && item.operation === 'Venda').length,
    rent: active.filter((item) => item.operation === 'Arrendamento').length,
    vehicles: active.filter((item) => item.category === 'Veículo').length,
    land: active.filter((item) => item.propertyType === 'Terreno').length,
    store: active.filter((item) => item.propertyType === 'Loja').length,
    office: active.filter((item) => item.propertyType === 'Escritório').length,
  }
}

export function formatLiveCount(count) {
  if (!count) return 'Explorar catálogo'
  if (count === 1) return '1 anúncio activo'
  return `${count} anúncios activos`
}

export function computeProvinceCounts(listings = []) {
  const active = listings.filter((item) => item.status === 'Ativo')
  const counts = {}
  active.forEach((item) => {
    if (!item.province) return
    counts[item.province] = (counts[item.province] || 0) + 1
  })
  return counts
}
