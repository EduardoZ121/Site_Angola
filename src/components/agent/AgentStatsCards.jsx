import { HelpTip } from '../ui/HelpTip'

const STAT_ITEMS = [
  { key: 'pending', label: 'Na fila', help: 'Anúncios à espera de aprovação do agente.' },
  { key: 'messages', label: 'Conversas', help: 'Mensagens de compradores nos anúncios.' },
  { key: 'visitsUpcoming', label: 'Visitas', help: 'Visitas agendadas e ainda por realizar.' },
  { key: 'unreadAlerts', label: 'Alertas', help: 'Notificações recentes da equipa Kuteka.' },
]

export function AgentStatsCards({ stats }) {
  return (
    <div className="agent-stats-grid">
      {STAT_ITEMS.map((item) => (
        <article className="agent-stat-card panel-card" key={item.key}>
          <div className="agent-stat-label-row">
            <span>{item.label}</span>
            <HelpTip label={`Ajuda: ${item.label}`} text={item.help} />
          </div>
          <strong>{Number(stats[item.key] || 0).toLocaleString('pt-PT')}</strong>
        </article>
      ))}
    </div>
  )
}
