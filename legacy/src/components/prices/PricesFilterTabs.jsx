import { PRICE_FILTERS } from '../../utils/prices'

export function PricesFilterTabs({ activeFilter, counts, onChange }) {
  return (
    <div className="prices-filter-tabs" role="tablist" aria-label="Filtrar relatório">
      {PRICE_FILTERS.map((item) => {
        const count = counts[item.id] ?? 0
        const isActive = activeFilter === item.id
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`prices-filter-tab${isActive ? ' active' : ''}`}
            onClick={() => onChange(item.id)}
          >
            {item.label}
            <span className="prices-filter-count">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
