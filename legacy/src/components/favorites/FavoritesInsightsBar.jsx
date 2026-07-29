import { Link } from 'react-router-dom'
import { formatKz } from '../../utils/format'
import { HelpTip } from '../ui/HelpTip'

export function FavoritesInsightsBar({ insight, compareCount }) {
  if (!insight?.total) return null

  return (
    <div className="favorites-insights-bar panel-card">
      <p>
        <strong>{insight.total}</strong> {insight.total === 1 ? 'favorito' : 'favoritos'}
        {insight.properties ? (
          <>
            {' '}
            — {insight.properties} {insight.properties === 1 ? 'imóvel' : 'imóveis'}
          </>
        ) : null}
        {insight.vehicles ? (
          <>
            {insight.properties ? ', ' : ' — '}
            {insight.vehicles} {insight.vehicles === 1 ? 'veículo' : 'veículos'}
          </>
        ) : null}
        {insight.avgPrice ? (
          <>
            {' '}
            — preço médio <strong>{formatKz(insight.avgPrice)}</strong>
            <HelpTip
              label="Ajuda: preço médio"
              text="Média dos preços dos anúncios guardados actualmente visíveis."
            />
          </>
        ) : null}
      </p>
      {compareCount > 0 ? (
        <Link className="text-button" to="/comparar">
          Ver comparação ({compareCount})
        </Link>
      ) : (
        <Link className="text-button" to="/comparar">
          Comparar anúncios
        </Link>
      )}
    </div>
  )
}
