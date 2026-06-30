import { HelpTip } from '../ui/HelpTip'

export function AgentInsightsBar({ items = [] }) {
  if (!items.length) {
    return (
      <div className="agent-insights-bar panel-card agent-insights-ok">
        <p>
          <strong>Tudo em dia</strong> — sem fila urgente nem visitas pendentes.
          <HelpTip
            label="Ajuda: painel agente"
            text="Novos anúncios, mensagens e visitas aparecem aqui quando precisam de acção."
          />
        </p>
      </div>
    )
  }

  return (
    <div className="agent-insights-bar panel-card" role="region" aria-label="Prioridades">
      <div className="agent-insights-head">
        <strong>Requer atenção</strong>
        <HelpTip
          label="Ajuda: prioridades"
          text="Toque num item para ir à secção correspondente no painel."
        />
      </div>
      <ul className="agent-insights-list">
        {items.map((item) => (
          <li key={item.id}>
            <a className={`agent-insight-chip tone-${item.tone}`} href={`#${item.sectionId}`}>
              <span className="agent-insight-label">{item.label}</span>
              <span className="agent-insight-detail">{item.detail}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
