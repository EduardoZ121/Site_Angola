import { HelpTip } from '../ui/HelpTip'

export function PublishInsightsBar({ stats }) {
  if (!stats?.activeCount) return null

  return (
    <div className="publish-insights-bar panel-card">
      <p>
        <strong>{stats.activeCount}</strong>{' '}
        {stats.activeCount === 1 ? 'anúncio activo' : 'anúncios activos'} no Kuteka
        {stats.ownerCount ? (
          <>
            {' '}
            — <strong>{stats.ownerCount}</strong>{' '}
            {stats.ownerCount === 1 ? 'proprietário' : 'proprietários'}
          </>
        ) : null}
        {stats.pendingCount ? (
          <>
            {' '}
            — <strong>{stats.pendingCount}</strong> em revisão
            <HelpTip
              label="Ajuda: revisão"
              text="Novos anúncios passam por moderação antes de ficarem visíveis no catálogo."
            />
          </>
        ) : null}
      </p>
    </div>
  )
}
