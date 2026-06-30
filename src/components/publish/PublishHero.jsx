import { HomeIcon } from '../icons/HomeIcon'

const TRUST_ITEMS = [
  { icon: 'shield', text: 'Sem intermediários' },
  { icon: 'check', text: 'Publicação gratuita' },
  { icon: 'shield', text: 'Anúncios verificados' },
  { icon: 'message', text: 'Suporte da equipa Kuteka' },
]

const STATS = [
  { icon: 'bolt', value: '2.400+', label: 'Anúncios publicados' },
  { icon: 'user', value: '850+', label: 'Proprietários activos' },
  { icon: 'clock', value: '< 4 h', label: 'Resposta média' },
]

export function PublishHero({ editMode = false }) {
  if (editMode) {
    return (
      <header className="publish-hero publish-hero-compact">
        <p className="publish-hero-eyebrow">Editar anúncio</p>
        <h1>Actualizar o seu anúncio</h1>
        <p className="publish-hero-lead">Alterações guardadas automaticamente. Anúncios activos voltam à revisão.</p>
      </header>
    )
  }

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
        {STATS.map((item) => (
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
