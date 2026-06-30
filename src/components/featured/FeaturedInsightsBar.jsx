import { Link } from 'react-router-dom'
import { formatKz } from '../../utils/format'
import { HelpTip } from '../ui/HelpTip'

export function FeaturedInsightsBar({ insight }) {
  if (!insight?.total) return null

  return (
    <div className="featured-insights-bar panel-card">
      <p>
        <strong>{insight.total}</strong> {insight.total === 1 ? 'destaque activo' : 'destaques activos'}
        {insight.totalViews ? (
          <>
            {' '}
            — <strong>{insight.totalViews}</strong> visualizações totais
          </>
        ) : null}
        {insight.avgPrice ? (
          <>
            {' '}
            — preço médio <strong>{formatKz(insight.avgPrice)}</strong>
            <HelpTip
              label="Ajuda: preço médio"
              text="Média dos preços dos anúncios em destaque actualmente visíveis."
            />
          </>
        ) : null}
      </p>
      <Link className="text-button" to="/comparar">
        Comparar destaques
      </Link>
    </div>
  )
}
