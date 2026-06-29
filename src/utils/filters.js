import { defaultFilters } from '../data/constants'

const URL_SKIP_DEFAULTS = { sort: 'recent', view: 'grid', page: '1' }

export function filtersToSearchParams(filters) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (URL_SKIP_DEFAULTS[key] === value) return
    if (value !== undefined && value !== null && value !== '' && value !== 'Todos') {
      params.set(key, String(value))
    }
  })
  return params
}

export function searchParamsToFilters(searchParams, overrides = {}) {
  const filters = {
    ...defaultFilters,
    ...overrides,
  }

  Object.keys(defaultFilters).forEach((key) => {
    const value = searchParams.get(key)
    if (value !== null) {
      filters[key] = value
    }
  })

  return filters
}

export function activeFilterCount(filters, defaults = {}) {
  return Object.keys(defaultFilters).filter((key) => {
    const value = filters[key]
    const fallback = defaults[key] ?? defaultFilters[key]
    if (key === 'query') return Boolean(value)
    return value !== fallback && value !== '' && value !== 'Todos'
  }).length
}

export function filterSummary(filters) {
  const parts = []
  if (filters.province !== 'Todos') parts.push(filters.province)
  if (filters.municipality !== 'Todos') parts.push(filters.municipality)
  if (filters.neighborhood !== 'Todos') parts.push(filters.neighborhood)
  if (filters.minPrice) parts.push(`mín. ${filters.minPrice} Kz`)
  if (filters.maxPrice) parts.push(`máx. ${filters.maxPrice} Kz`)
  if (filters.propertyType !== 'Todos') parts.push(filters.propertyType)
  if (filters.minBedrooms) parts.push(`${filters.minBedrooms}+ quartos`)
  return parts.join(' • ')
}
