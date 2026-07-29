import { HelpTip } from '../ui/HelpTip'

const STAT_ITEMS = [
  { key: 'users', label: 'Utilizadores', help: 'Contas registadas neste browser (demo local).' },
  { key: 'total', label: 'Anúncios', help: 'Total de anúncios no marketplace.' },
  { key: 'active', label: 'Activos', help: 'Visíveis no catálogo público.' },
  { key: 'pending', label: 'Na fila', help: 'Aguardam aprovação antes de publicar.' },
  { key: 'rejected', label: 'Rejeitados', help: 'Recusados pela moderação.' },
  { key: 'featured', label: 'Destaques', help: 'Anúncios com destaque activo.' },
  { key: 'agents', label: 'Agentes', help: 'Intermediários aprovados na equipa.' },
  { key: 'agentQueue', label: 'Candidatos', help: 'Candidaturas a agente em processo.' },
]

export function AdminStatsCards({ stats }) {
  return (
    <div className="admin-stats-grid">
      {STAT_ITEMS.map((item) => (
        <article className="admin-stat-card panel-card" key={item.key}>
          <div className="admin-stat-label-row">
            <span>{item.label}</span>
            <HelpTip label={`Ajuda: ${item.label}`} text={item.help} />
          </div>
          <strong>{Number(stats[item.key] || 0).toLocaleString('pt-PT')}</strong>
        </article>
      ))}
    </div>
  )
}
