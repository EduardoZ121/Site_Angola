export const COMPARE_MAX = 3

export function resolveCompareItems(listings = [], compareIds = []) {
  return compareIds.map((id) => listings.find((listing) => listing.id === id)).filter(Boolean)
}

export function getStaleCompareIds(compareIds = [], listings = []) {
  const activeIds = new Set(listings.map((listing) => listing.id))
  return compareIds.filter((id) => !activeIds.has(id))
}

export function getLowestPriceItemId(items = []) {
  const priced = items.filter((item) => Number(item.price) > 0)
  if (!priced.length) return null
  return priced.reduce((lowest, item) =>
    Number(item.price) < Number(lowest.price) ? item : lowest,
  ).id
}

export function getCompareAddLink(items = []) {
  if (!items.length) return '/explorar'
  if (items.every((item) => item.category === 'Veículo')) return '/veiculos'
  if (items.every((item) => item.operation === 'Arrendamento')) return '/arrendar'
  if (items.every((item) => item.category === 'Imóvel' && item.operation === 'Venda')) {
    return '/comprar'
  }
  return '/explorar'
}

export function buildCompareFeatureRows(items = []) {
  if (!items.length) return []

  const hasProperty = items.some((item) => item.category === 'Imóvel')
  const hasVehicle = items.some((item) => item.category === 'Veículo')

  const rows = [{ key: 'price', label: 'Preço', type: 'price' }]

  if (hasProperty && !hasVehicle) {
    rows.push(
      { key: 'operation', label: 'Operação', type: 'text' },
      { key: 'propertyType', label: 'Tipo', type: 'text' },
      { key: 'bedrooms', label: 'Quartos', type: 'text' },
      { key: 'bathrooms', label: 'Casas de banho', type: 'text' },
      { key: 'area', label: 'Área', type: 'area' },
    )
  } else if (hasVehicle && !hasProperty) {
    rows.push(
      { key: 'brand', label: 'Marca', type: 'text' },
      { key: 'model', label: 'Modelo', type: 'text' },
      { key: 'year', label: 'Ano', type: 'text' },
      { key: 'mileage', label: 'Quilometragem', type: 'mileage' },
      { key: 'fuel', label: 'Combustível', type: 'text' },
      { key: 'gearbox', label: 'Caixa', type: 'text' },
      { key: 'condition', label: 'Estado', type: 'text' },
    )
  } else {
    rows.push(
      { key: 'category', label: 'Categoria', type: 'text' },
      { key: 'operation', label: 'Operação', type: 'text' },
    )
  }

  rows.push(
    { key: 'location', label: 'Local', type: 'location' },
    { key: 'reference', label: 'Referência', type: 'text' },
  )

  return rows
}

export function getCompareCellValue(item, row) {
  switch (row.key) {
    case 'price':
      return item.price
    case 'area':
      return item.area ? `${item.area} m²` : '—'
    case 'mileage':
      return item.mileage ? `${Number(item.mileage).toLocaleString('pt-AO')} km` : '—'
    case 'location':
      return [item.neighborhood, item.municipality, item.province].filter(Boolean).join(', ')
    default:
      return item[row.key] || '—'
  }
}

export function computeCompareInsight(items = []) {
  const prices = items.map((item) => Number(item.price)).filter((value) => value > 0)
  if (!prices.length) {
    return { count: items.length, min: null, max: null, spread: null }
  }
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return {
    count: items.length,
    min,
    max,
    spread: max - min,
  }
}
