import { HomeIcon } from '../icons/HomeIcon'

const TRUST_ITEMS = [
  { icon: 'shield', text: 'Sem intermediários' },
  { icon: 'check', text: 'Publicação gratuita' },
  { icon: 'shield', text: 'Anúncios verificados' },
  { icon: 'message', text: 'Suporte da equipa Kuteka' },
]

const FALLBACK_STATS = [
  { icon: 'bolt', value: '2.400+', label: 'Anúncios publicados' },
  { icon: 'user', value: '850+', label: 'Proprietários activos' },
  { icon: 'clock', value: '< 4 h', label: 'Resposta média' },
]

function buildStats(marketStats) {
  if (!marketStats?.activeCount) return FALLBACK_STATS

  return [
    {
      icon: 'bolt',
      value: `${marketStats.activeCount}+`,
      label: marketStats.activeCount === 1 ? 'Anúncio activo' : 'Anúncios activos',
    },
    {
      icon: 'user',
      value: marketStats.ownerCount ? `${marketStats.ownerCount}+` : '—',
      label: marketStats.ownerCount === 1 ? 'Proprietário activo' : 'Proprietários activos',
    },
    {
      icon: 'clock',
      value: marketStats.pendingCount ? `${marketStats.pendingCount}` : '< 4 h',
      label: marketStats.pendingCount ? 'Em revisão agora' : 'Resposta média',
    },
  ]
}

export function PublishHero({ editMode = false, marketStats }) {
  if (editMode) {
    return (
      <header className="publish-hero publish-hero-compact">
        <p className="publish-hero-eyebrow">Editar anúncio</p>
        <h1>Actualizar o seu anúncio</h1>
        <p className="publish-hero-lead">Alterações guardadas automaticamente. Anúncios activos voltam à revisão.</p>
      </header>
    )
  }

  const stats = buildStats(marketStats)

  return (
    <header className="publish-hero">
      <p className="publish-hero-eyebrow">Publicar na Kuteka</p>
      <h1>Publicar o seu imóvel ou veículo</h1>
      <p className="publish-hero-sub">Venda ou arrende mais depressa.</p>
      <p className="publish-hero-lead">
        Publique gratuitamente. Receba contactos de compradores reais. Todo o processo demora menos de 5 minutos.
      </p>

      <ul className="publish-trust-list">
        {TRUST_ITEMS.map((item) => (
          <li key={item.text}>
            <HomeIcon name={item.icon} />
            <span>{item.text}</span>
          </li>
        ))}
      </ul>

      <div className="publish-stats-row">
        {stats.map((item) => (
          <article key={item.label} className="publish-stat-card">
            <span className="publish-stat-icon" aria-hidden="true">
              <HomeIcon name={item.icon} />
            </span>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </div>
    </header>
  )
}
