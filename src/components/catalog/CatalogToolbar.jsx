import { SORT_OPTIONS } from '../../utils/catalog'
import { HomeIcon } from '../icons/HomeIcon'

const GRID_SIZE_OPTIONS = [
  { value: 'sm', label: 'Pequeno', title: 'Grelha compacta — mais cartões' },
  { value: 'md', label: 'Médio', title: 'Grelha padrão' },
  { value: 'lg', label: 'Grande', title: 'Grelha grande — fotos maiores' },
]

export function CatalogToolbar({
  total,
  sort,
  view,
  gridSize = 'md',
  onSortChange,
  onViewChange,
  onGridSizeChange,
  mapPath,
}) {
  return (
    <div className="catalog-toolbar">
      <p className="catalog-results-count" aria-live="polite">
        <strong>{total}</strong> {total === 1 ? 'resultado' : 'resultados'}
      </p>
      <div className="catalog-toolbar-actions">
        {mapPath ? (
          <a className="catalog-map-link" href={mapPath}>
            Mapa
          </a>
        ) : null}
        <label className="catalog-sort">
          <span className="sr-only">Ordenar por</span>
          Ordenar
          <select value={sort} onChange={(event) => onSortChange(event.target.value)} aria-label="Ordenar resultados">
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {view === 'grid' && onGridSizeChange ? (
          <div className="catalog-grid-size" role="group" aria-label="Tamanho da grelha">
            {GRID_SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={gridSize === option.value ? 'active' : ''}
                title={option.title}
                aria-pressed={gridSize === option.value}
                onClick={() => onGridSizeChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
        <div className="catalog-view-toggle" role="group" aria-label="Modo de visualização">
          <button
            type="button"
            className={view === 'grid' ? 'active' : ''}
            onClick={() => onViewChange('grid')}
            aria-pressed={view === 'grid'}
            title="Grelha"
          >
            <HomeIcon name="grid" />
            <span className="catalog-view-label">Grelha</span>
          </button>
          <button
            type="button"
            className={view === 'list' ? 'active' : ''}
            onClick={() => onViewChange('list')}
            aria-pressed={view === 'list'}
            title="Lista"
          >
            <HomeIcon name="columns" />
            <span className="catalog-view-label">Lista</span>
          </button>
        </div>
      </div>
    </div>
  )
}
