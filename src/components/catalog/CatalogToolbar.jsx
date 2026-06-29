import { SORT_OPTIONS } from '../../utils/catalog'

export function CatalogToolbar({
  total,
  sort,
  view,
  onSortChange,
  onViewChange,
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
            Ver mapa (em breve)
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
        <div className="catalog-view-toggle" role="group" aria-label="Modo de visualização">
          <button
            type="button"
            className={view === 'grid' ? 'active' : ''}
            onClick={() => onViewChange('grid')}
            aria-pressed={view === 'grid'}
          >
            Grelha
          </button>
          <button
            type="button"
            className={view === 'list' ? 'active' : ''}
            onClick={() => onViewChange('list')}
            aria-pressed={view === 'list'}
          >
            Lista
          </button>
        </div>
      </div>
    </div>
  )
}
