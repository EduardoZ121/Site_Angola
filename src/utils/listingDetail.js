export function getCatalogPathForListing(listing) {
  if (!listing) return '/explorar'
  if (listing.category === 'Veículo') return '/veiculos'
  if (listing.operation === 'Arrendamento') return '/arrendar'
  return '/comprar'
}

export function getCatalogLabelForListing(listing) {
  if (!listing) return 'Explorar'
  if (listing.category === 'Veículo') return 'Veículos'
  if (listing.operation === 'Arrendamento') return 'Arrendar'
  return 'Comprar'
}

function buildCatalogParams(listing) {
  const params = new URLSearchParams()
  if (listing.province && listing.province !== 'Todos') params.set('province', listing.province)
  if (listing.municipality && listing.municipality !== 'Todos') {
    params.set('municipality', listing.municipality)
  }
  if (listing.neighborhood && listing.neighborhood !== 'Todos') {
    params.set('neighborhood', listing.neighborhood)
  }
  if (listing.category === 'Veículo') {
    if (listing.brand) params.set('brand', listing.brand)
  } else if (listing.propertyType && listing.propertyType !== 'Todos') {
    params.set('propertyType', listing.propertyType)
  }
  return params
}

export function buildCatalogSearchLink(listing) {
  const base = getCatalogPathForListing(listing)
  const query = buildCatalogParams(listing).toString()
  return query ? `${base}?${query}` : base
}

export function buildCatalogFiltersLink(listing) {
  const base = `${getCatalogPathForListing(listing)}/filtros`
  const query = buildCatalogParams(listing).toString()
  return query ? `${base}?${query}` : base
}

export function buildSimilarCatalogLink(listing) {
  const base = getCatalogPathForListing(listing)
  const params = new URLSearchParams()
  if (listing.province) params.set('province', listing.province)
  if (listing.operation && listing.operation !== 'Todos') params.set('operation', listing.operation)
  const query = params.toString()
  return query ? `${base}?${query}` : base
}

export function formatDetailPrice(listing, formatKz) {
  const formatted = formatKz(listing.price ?? listing.pricing?.amount)
  return listing.operation === 'Arrendamento' ? `${formatted}/mês` : formatted
}

export function formatPublishedDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('pt-AO', { day: 'numeric', month: 'short', year: 'numeric' })
}
