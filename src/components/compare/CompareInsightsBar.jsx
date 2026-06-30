import { formatKz } from '../../utils/format'
import { HelpTip } from '../ui/HelpTip'

export function CompareInsightsBar({ insight, lowestId }) {
  if (!insight?.count) return null

  return (
    <div className="compare-insights-bar panel-card">
      <p>
        <strong>{insight.count}</strong> de 3 selecionados
        {insight.spread != null && insight.spread > 0 ? (
          <>
            {' '}
            — diferença de preço <strong>{formatKz(insight.spread)}</strong>
            <HelpTip
              label="Ajuda: diferença de preço"
              text="Intervalo entre o anúncio mais barato e o mais caro na comparação actual."
            />
          </>
        ) : null}
        {lowestId ? (
          <>
            {' '}
            <span className="compare-insights-note">(menor preço destacado)</span>
          </>
        ) : null}
      </p>
    </div>
  )
}
