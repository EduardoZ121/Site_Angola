import { Link } from 'react-router-dom'
import { HelpTip } from '../ui/HelpTip'

export function OwnerInsightsBar({ items = [], onFilter }) {
  if (!items.length) return null

  return (
    <div className="owner-insights-bar panel-card" role="region" aria-label="Acções sugeridas">
      <div className="owner-insights-head">
        <strong>Requer atenção</strong>
        <HelpTip
          label="Ajuda: acções"
          text="Sugestões com base no estado dos seus anúncios. Toque num item para filtrar ou editar."
        />
      </div>
      <ul className="owner-insights-list">
        {items.map((item) => (
          <li key={item.id}>
            {item.filterId ? (
              <button
                type="button"
                className={`owner-insight-chip tone-${item.tone}`}
                onClick={() => onFilter?.(item.filterId)}
              >
                <span className="owner-insight-label">{item.label}</span>
                <span className="owner-insight-detail">{item.detail}</span>
              </button>
            ) : item.listingId ? (
              <Link
                className={`owner-insight-chip tone-${item.tone}`}
                to={`/painel/editar/${item.listingId}`}
              >
                <span className="owner-insight-label">{item.label}</span>
                <span className="owner-insight-detail">{item.detail}</span>
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
