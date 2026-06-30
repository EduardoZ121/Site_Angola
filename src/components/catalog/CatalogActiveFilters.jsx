import { Link } from 'react-router-dom'
import { filtersToSearchParams } from '../../utils/filters'
import { formatKz } from '../../utils/format'

function priceSuffix(basePath) {
  return basePath === 'arrendar' ? '/mês' : ''
}

function propertyTypeLabel(value) {
  if (value === 'Carro') return 'Carros'
  if (value === 'Pickup') return 'Pickup / SUV'
  return value
}

const BASE_CHIP_DEFS = [
  { key: 'query', label: (value) => `«${value}»` },
  { key: 'province', label: (value) => value },
  { key: 'municipality', label: (value) => value },
  { key: 'neighborhood', label: (value) => value },
  { key: 'propertyType', label: (value) => propertyTypeLabel(value) },
  {
    key: 'minPrice',
    label: (value, basePath) => `Mín. ${formatKz(Number(value))}${priceSuffix(basePath)}`,
  },
  {
    key: 'maxPrice',
    label: (value, basePath) => `Máx. ${formatKz(Number(value))}${priceSuffix(basePath)}`,
  },
  { key: 'minBedrooms', label: (value) => `${value}+ quartos` },
  { key: 'minArea', label: (value) => `${value}+ m²` },
]

const VEHICLE_CHIP_DEFS = [
  { key: 'brand', label: (value) => `Marca: ${value}` },
  { key: 'model', label: (value) => `Modelo: ${value}` },
  { key: 'yearMin', label: (value) => `Desde ${value}` },
  { key: 'yearMax', label: (value) => `Até ${value}` },
  {
    key: 'mileageMax',
    label: (value) => `≤ ${Number(value).toLocaleString('pt-AO')} km`,
  },
  { key: 'fuel', label: (value) => value },
  { key: 'gearbox', label: (value) => value },
  { key: 'condition', label: (value) => value },
]

const PROPERTY_ONLY_KEYS = new Set(['minBedrooms', 'minArea'])

function getChipDefs(basePath) {
  const base = BASE_CHIP_DEFS.filter(
    (item) => basePath !== 'veiculos' || !PROPERTY_ONLY_KEYS.has(item.key),
  )
  if (basePath === 'veiculos') return [...base, ...VEHICLE_CHIP_DEFS]
  return base
}

function isActiveChip(key, value, defaults) {
  if (!value || value === 'Todos' || value === '') return false
  if (defaults[key] !== undefined && value === defaults[key]) return false
  return true
}

export function CatalogActiveFilters({ filters, defaults, basePath, onUpdate }) {
  const chipDefs = getChipDefs(basePath)
  const chips = chipDefs
    .filter((item) => isActiveChip(item.key, filters[item.key], defaults))
    .map((item) => ({
      key: item.key,
      label: item.label(filters[item.key], basePath),
    }))

  if (!chips.length) return null

  function clearFilter(key) {
    const next = { ...filters, page: '1' }
    if (key === 'query') next.query = ''
    else if (key === 'propertyType') next.propertyType = defaults.propertyType || 'Todos'
    else if (key.startsWith('min') || key.startsWith('max') || key === 'brand' || key === 'model') {
      next[key] = ''
    } else next[key] = 'Todos'
    onUpdate(next)
  }

  function clearAll() {
    const next = {
      ...filters,
      query: '',
      province: defaults.province || 'Todos',
      municipality: defaults.municipality || 'Todos',
      neighborhood: defaults.neighborhood || 'Todos',
      propertyType: defaults.propertyType || 'Todos',
      minPrice: '',
      maxPrice: '',
      minBedrooms: '',
      minArea: '',
      page: '1',
    }
    if (basePath === 'veiculos') {
      next.brand = ''
      next.model = ''
      next.yearMin = ''
      next.yearMax = ''
      next.mileageMax = ''
      next.fuel = 'Todos'
      next.gearbox = 'Todos'
      next.condition = 'Todos'
    }
    onUpdate(next)
  }

  const mapLink = `/${basePath}/filtros?${filtersToSearchParams(filters).toString()}`

  return (
    <div className="catalog-active-filters panel-card">
      <div className="catalog-active-filters-head">
        <strong>Filtros activos</strong>
        <button type="button" className="text-button" onClick={clearAll}>
          Limpar tudo
        </button>
      </div>
      <div className="catalog-active-filters-chips">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className="catalog-filter-chip"
            onClick={() => clearFilter(chip.key)}
            title={`Remover filtro: ${chip.label}`}
          >
            {chip.label}
            <span aria-hidden="true">×</span>
          </button>
        ))}
      </div>
      <Link className="catalog-active-filters-map text-button" to={mapLink}>
        Editar no mapa
      </Link>
    </div>
  )
}
