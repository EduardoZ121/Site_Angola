import { Link } from 'react-router-dom'
import { formatKz } from '../../utils/format'
import { getCatalogSection } from '../../utils/catalogConfig'
import { HelpTip } from '../ui/HelpTip'

export function CatalogInsightsBar({ insight, basePath, total }) {
  const section = getCatalogSection(basePath)
  if (!section || (!insight && !total)) return null

  const resultLabel = total === 1 ? section.resultSingular : section.resultPlural

  return (
    <div className="catalog-insights-bar panel-card">
      <p>
        <strong>{total}</strong> {resultLabel}
        {insight ? (
          <>
            {' '}
            — {section.priceInsightLabel}{' '}
            <strong>
              {formatKz(insight.avg)}
              {section.monthlyPrice ? '/mês' : ''}
            </strong>
            <HelpTip label={`Ajuda: ${section.priceInsightLabel}`} text={section.priceInsightHelp} />
          </>
        ) : null}
      </p>
      {section.secondaryLink ? (
        <Link className="text-button" to={section.secondaryLink.to}>
          {section.secondaryLink.label}
        </Link>
      ) : null}
    </div>
  )
}
