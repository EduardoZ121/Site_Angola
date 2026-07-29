import { FEATURED_FILTERS } from '../../utils/featured'

export function FeaturedFilterTabs({ activeFilter, counts, onChange }) {
  return (
    <div className="featured-filter-tabs" role="tablist" aria-label="Filtrar destaques">
      {FEATURED_FILTERS.map((item) => {
        const count = counts[item.id] ?? 0
        const isActive = activeFilter === item.id
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`featured-filter-tab${isActive ? ' active' : ''}`}
            onClick={() => onChange(item.id)}
          >
            {item.label}
            <span className="featured-filter-count">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
