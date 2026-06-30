import { HomeIcon } from '../icons/HomeIcon'

export function PropertyTypeGrid({ types, activeType, onSelect }) {
  return (
    <div className="catalog-type-grid" role="group" aria-label="Tipo de imóvel">
      {types.map((item) => {
        const isActive = activeType === item.propertyType
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
          </button>
        )
      })}
    </div>
  )
}
