import { HelpTip } from '../ui/HelpTip'

const STAT_ITEMS = [
  {
    key: 'total',
    label: 'Anúncios',
    help: 'Total de anúncios associados à sua conta Kuteka.',
  },
  {
    key: 'active',
    label: 'Publicados',
    help: 'Anúncios aprovados e visíveis para compradores.',
  },
  {
    key: 'pending',
    label: 'Em revisão',
    help: 'Aguardam aprovação da equipa Kuteka antes de ficarem públicos.',
  },
  {
    key: 'totalViews',
    label: 'Visualizações',
    help: 'Soma de vezes que os seus anúncios foram abertos.',
  },
  {
    key: 'totalFavorites',
    label: 'Favoritos',
    help: 'Anúncios guardados por compradores (conta actual).',
  },
  {
    key: 'totalMessages',
    label: 'Mensagens',
    help: 'Mensagens recebidas nos chats dos seus anúncios.',
  },
]

export function OwnerStatsCards({ stats }) {
  return (
    <div className="owner-stats-grid">
      {STAT_ITEMS.map((item) => (
        <article className="owner-stat-card stat-card" key={item.key}>
          <div className="owner-stat-label-row">
            <span>{item.label}</span>
            <HelpTip label={`Ajuda: ${item.label}`} text={item.help} />
          </div>
          <strong>{Number(stats[item.key] || 0).toLocaleString('pt-PT')}</strong>
        </article>
      ))}
    </div>
  )
}
