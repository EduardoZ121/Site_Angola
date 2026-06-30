import { FAVORITE_FILTERS } from '../../utils/favorites'

export function FavoritesFilterTabs({ activeFilter, counts, onChange }) {
  return (
    <div className="favorites-filter-tabs" role="tablist" aria-label="Filtrar favoritos">
      {FAVORITE_FILTERS.map((item) => {
        const count = counts[item.id] ?? 0
        const isActive = activeFilter === item.id
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`favorites-filter-tab${isActive ? ' active' : ''}`}
            onClick={() => onChange(item.id)}
          >
            {item.label}
            <span className="favorites-filter-count">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
