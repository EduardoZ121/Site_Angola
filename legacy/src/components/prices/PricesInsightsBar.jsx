import { formatKz } from '../../utils/format'
import { HelpTip } from '../ui/HelpTip'

export function PricesInsightsBar({ insight, filterId }) {
  if (!insight?.listings) return null

  const isRent = filterId === 'rent'

  return (
    <div className="prices-insights-bar panel-card">
      <p>
        <strong>{insight.listings}</strong> {insight.listings === 1 ? 'anúncio' : 'anúncios'} analisados
        {insight.zones ? (
          <>
            {' '}
            em <strong>{insight.zones}</strong> {insight.zones === 1 ? 'zona' : 'zonas'}
          </>
        ) : null}
        {insight.avg ? (
          <>
            {' '}
            — média geral <strong>{formatKz(insight.avg)}</strong>
            {isRent ? '/mês' : ''}
            <HelpTip
              label="Ajuda: média geral"
              text="Calculada com base nos anúncios activos do filtro seleccionado."
            />
          </>
        ) : null}
      </p>
      {insight.cheapestZone ? (
        <span className="prices-insights-note">Zona mais acessível: {insight.cheapestZone}</span>
      ) : null}
    </div>
  )
}
