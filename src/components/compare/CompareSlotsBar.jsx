import { Link } from 'react-router-dom'
import { COMPARE_MAX } from '../../utils/compare'

export function CompareSlotsBar({ items, addLink }) {
  const slots = Array.from({ length: COMPARE_MAX }, (_, index) => items[index] || null)

  return (
    <div className="compare-slots-bar panel-card" aria-label="Slots de comparação">
      <div className="compare-slots">
        {slots.map((item, index) => (
          <div
            key={item?.id || `slot-${index}`}
            className={`compare-slot${item ? ' filled' : ' empty'}`}
          >
            {item ? (
              <>
                <span className="compare-slot-index">{index + 1}</span>
                <strong>{item.title}</strong>
              </>
            ) : (
              <>
                <span className="compare-slot-index">{index + 1}</span>
                <span className="compare-slot-empty-label">Vazio</span>
              </>
            )}
          </div>
        ))}
      </div>
      {items.length < COMPARE_MAX ? (
        <Link className="text-button compare-slots-add" to={addLink}>
          + Adicionar anúncio
        </Link>
      ) : null}
    </div>
  )
}
