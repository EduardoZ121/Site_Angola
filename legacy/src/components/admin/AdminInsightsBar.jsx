import { HelpTip } from '../ui/HelpTip'

export function AdminInsightsBar({ items = [] }) {
  if (!items.length) {
    return (
      <div className="admin-insights-bar panel-card admin-insights-ok">
        <p>
          <strong>Fila em dia</strong> — sem pendências urgentes de moderação.
          <HelpTip
            label="Ajuda: fila"
            text="Novos anúncios e candidatos a agente aparecem aqui quando precisam de acção."
          />
        </p>
      </div>
    )
  }

  return (
    <div className="admin-insights-bar panel-card" role="region" aria-label="Prioridades">
      <div className="admin-insights-head">
        <strong>Prioridade</strong>
        <HelpTip
          label="Ajuda: prioridades"
          text="Toque num item para ir à secção correspondente no painel."
        />
      </div>
      <ul className="admin-insights-list">
        {items.map((item) => (
          <li key={item.id}>
            <a className={`admin-insight-chip tone-${item.tone}`} href={`#${item.sectionId}`}>
              <span className="admin-insight-label">{item.label}</span>
              <span className="admin-insight-detail">{item.detail}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
