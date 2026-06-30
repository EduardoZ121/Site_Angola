import { Link } from 'react-router-dom'
import { defaultPhoto } from '../../data/constants'
import { formatKz } from '../../utils/format'
import { HomeIcon } from '../icons/HomeIcon'

function formatItemPrice(item) {
  const price = formatKz(item.price)
  return item.operation === 'Arrendamento' ? `${price}/mês` : price
}

export function CompareItemCard({ item, isLowest, onRemove }) {
  return (
    <article className={`compare-item-card panel-card${isLowest ? ' is-lowest' : ''}`}>
      <button
        type="button"
        className="compare-item-remove"
        onClick={() => onRemove(item.id)}
        aria-label={`Remover ${item.title} da comparação`}
      >
        <HomeIcon name="x" />
      </button>
      <Link className="compare-item-media" to={`/anuncio/${item.id}`}>
        <img src={item.photos?.[0] || defaultPhoto} alt="" loading="lazy" />
      </Link>
      <div className="compare-item-body">
        <Link className="compare-item-title" to={`/anuncio/${item.id}`}>
          {item.title}
        </Link>
        <p className={`compare-item-price${isLowest ? ' lowest' : ''}`}>{formatItemPrice(item)}</p>
        <p className="compare-item-loc">
          {item.neighborhood}, {item.municipality}
        </p>
        {item.category === 'Imóvel' ? (
          <p className="compare-item-specs">
            {item.propertyType}
            {item.bedrooms ? ` · ${item.bedrooms} q` : ''}
            {item.area ? ` · ${item.area} m²` : ''}
          </p>
        ) : (
          <p className="compare-item-specs">
            {item.brand} {item.model}
            {item.year ? ` · ${item.year}` : ''}
          </p>
        )}
        <Link className="button primary compare-item-open" to={`/anuncio/${item.id}`}>
          Ver anúncio
        </Link>
      </div>
    </article>
  )
}
