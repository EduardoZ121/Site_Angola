import { bairros, provinces } from '../data/constants'
import { FilterSelect } from './ui'

export function FiltersSidebar({ filters, setFilters, showVehicleFilters = false }) {
  return (
    <aside className="filters-panel">
      <h3>Filtros</h3>
      <label>
        Pesquisa
        <input
          placeholder="Bairro, marca, título..."
          value={filters.query}
          onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
        />
      </label>
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
        Preço mínimo
        <input
          type="number"
          value={filters.minPrice}
          onChange={(event) => setFilters((current) => ({ ...current, minPrice: event.target.value }))}
        />
      </label>
      <label>
        Preço máximo
        <input
          type="number"
          value={filters.maxPrice}
          onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))}
        />
      </label>
      {showVehicleFilters && (
        <>
          <p className="filter-heading">Veículos</p>
          <label>
            Marca
            <input
              value={filters.brand}
              onChange={(event) => setFilters((current) => ({ ...current, brand: event.target.value }))}
            />
          </label>
          <label>
            Modelo
            <input
              value={filters.model}
              onChange={(event) => setFilters((current) => ({ ...current, model: event.target.value }))}
            />
          </label>
          <FilterSelect
            label="Combustível"
            value={filters.fuel}
            onChange={(value) => setFilters((current) => ({ ...current, fuel: value }))}
            options={['Todos', 'Gasolina', 'Diesel', 'Elétrico', 'Híbrido']}
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
    </aside>
  )
}
