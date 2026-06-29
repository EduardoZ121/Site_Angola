import { bairros, provinces } from '../data/constants'
import { FilterSelect } from './ui'

const propertyTypes = ['Todos', 'Apartamento', 'Vivenda', 'Terreno', 'Loja']

export function FiltersSidebar({
  filters,
  setFilters,
  showVehicleFilters = false,
  showPropertyFilters = false,
  hideQuery = false,
}) {
  return (
    <aside className="filters-panel catalog-sidebar" aria-label="Filtros de pesquisa">
      <h3>Filtros</h3>
      {!hideQuery && (
        <label>
          Pesquisa
          <input
            placeholder="Bairro, marca, título..."
            value={filters.query}
            aria-label="Pesquisa por texto"
            onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
          />
        </label>
      )}
      {showPropertyFilters && (
        <FilterSelect
          label="Tipo de imóvel"
          value={filters.propertyType}
          onChange={(value) => setFilters((current) => ({ ...current, propertyType: value }))}
          options={propertyTypes}
        />
      )}
      <FilterSelect
        label="Província"
        value={filters.province}
        onChange={(value) => setFilters((current) => ({ ...current, province: value }))}
        options={['Todos', ...Object.keys(provinces)]}
      />
      <FilterSelect
        label="Município"
        value={filters.municipality}
        onChange={(value) => setFilters((current) => ({ ...current, municipality: value }))}
        options={['Todos', ...new Set(Object.values(provinces).flat())]}
      />
      <FilterSelect
        label="Bairro"
        value={filters.neighborhood}
        onChange={(value) => setFilters((current) => ({ ...current, neighborhood: value }))}
        options={['Todos', ...new Set(Object.values(bairros).flat())]}
      />
      <label>
        Preço mínimo (Kz)
        <input
          type="number"
          min="0"
          value={filters.minPrice}
          aria-label="Preço mínimo"
          onChange={(event) => setFilters((current) => ({ ...current, minPrice: event.target.value }))}
        />
      </label>
      <label>
        Preço máximo (Kz)
        <input
          type="number"
          min="0"
          value={filters.maxPrice}
          aria-label="Preço máximo"
          onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))}
        />
      </label>
      {showPropertyFilters && (
        <>
          <label>
            Quartos (mín.)
            <input
              type="number"
              min="0"
              value={filters.minBedrooms}
              aria-label="Número mínimo de quartos"
              onChange={(event) =>
                setFilters((current) => ({ ...current, minBedrooms: event.target.value }))
              }
            />
          </label>
          <label>
            Casas de banho (mín.)
            <input
              type="number"
              min="0"
              value={filters.minBathrooms}
              aria-label="Número mínimo de casas de banho"
              onChange={(event) =>
                setFilters((current) => ({ ...current, minBathrooms: event.target.value }))
              }
            />
          </label>
          <label>
            Área mínima (m²)
            <input
              type="number"
              min="0"
              value={filters.minArea}
              aria-label="Área mínima em metros quadrados"
              onChange={(event) => setFilters((current) => ({ ...current, minArea: event.target.value }))}
            />
          </label>
        </>
      )}
      {showVehicleFilters && (
        <>
          <p className="filter-heading">Veículos</p>
          <label>
            Marca
            <input
              value={filters.brand}
              aria-label="Marca do veículo"
              onChange={(event) => setFilters((current) => ({ ...current, brand: event.target.value }))}
            />
          </label>
          <label>
            Modelo
            <input
              value={filters.model}
              aria-label="Modelo do veículo"
              onChange={(event) => setFilters((current) => ({ ...current, model: event.target.value }))}
            />
          </label>
          <label>
            Ano mínimo
            <input
              type="number"
              value={filters.yearMin}
              aria-label="Ano mínimo"
              onChange={(event) => setFilters((current) => ({ ...current, yearMin: event.target.value }))}
            />
          </label>
          <label>
            Ano máximo
            <input
              type="number"
              value={filters.yearMax}
              aria-label="Ano máximo"
              onChange={(event) => setFilters((current) => ({ ...current, yearMax: event.target.value }))}
            />
          </label>
          <label>
            Quilometragem máx. (km)
            <input
              type="number"
              min="0"
              value={filters.mileageMax}
              aria-label="Quilometragem máxima"
              onChange={(event) =>
                setFilters((current) => ({ ...current, mileageMax: event.target.value }))
              }
            />
          </label>
          <FilterSelect
            label="Combustível"
            value={filters.fuel}
            onChange={(value) => setFilters((current) => ({ ...current, fuel: value }))}
            options={['Todos', 'Gasolina', 'Diesel', 'Eléctrico', 'Híbrido']}
          />
          <FilterSelect
            label="Caixa"
            value={filters.gearbox}
            onChange={(value) => setFilters((current) => ({ ...current, gearbox: value }))}
            options={['Todos', 'Automática', 'Manual']}
          />
          <FilterSelect
            label="Estado"
            value={filters.condition}
            onChange={(value) => setFilters((current) => ({ ...current, condition: value }))}
            options={['Todos', 'Novo', 'Semi-novo', 'Usado']}
          />
        </>
      )}
      <button
        type="button"
        className="button ghost catalog-clear-filters"
        onClick={() =>
          setFilters({
            ...filters,
            query: '',
            propertyType: 'Todos',
            province: 'Todos',
            municipality: 'Todos',
            neighborhood: 'Todos',
            minPrice: '',
            maxPrice: '',
            minBedrooms: '',
            minBathrooms: '',
            minArea: '',
            brand: '',
            model: '',
            yearMin: '',
            yearMax: '',
            mileageMax: '',
            fuel: 'Todos',
            gearbox: 'Todos',
            condition: 'Todos',
            page: '1',
          })
        }
      >
        Limpar filtros
      </button>
    </aside>
  )
}
