import { HomeIcon } from '../icons/HomeIcon'

export function PropertyTypeGrid({ types, activeType, onSelect, counts = {}, ariaLabel = 'Tipo de imóvel' }) {
  return (
    <div className="catalog-type-grid" role="group" aria-label={ariaLabel}>
      {types.map((item) => {
        const isActive = activeType === item.propertyType
        const count = counts[item.propertyType]
        return (
          <button
            key={item.id}
            type="button"
            className={`catalog-type-chip${isActive ? ' active' : ''}`}
            aria-pressed={isActive}
            onClick={() => onSelect(item.propertyType)}
          >
            <span className="catalog-type-chip-icon" aria-hidden="true">
              <HomeIcon name={item.icon} />
            </span>
            <span className="catalog-type-chip-label">{item.label}</span>
            {count !== undefined ? (
              <span className="catalog-type-chip-count">{count}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
