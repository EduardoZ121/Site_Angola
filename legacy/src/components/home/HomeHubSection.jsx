import { Link } from 'react-router-dom'
import { homeHubSections, homeQuickActions } from '../../data/homeContent'
import { HomeIcon } from '../icons/HomeIcon'

export function HomeHubSection() {
  return (
    <section className="hp-section hp-hub-section">
      <div className="hp-container">
        <div className="hp-section-head">
          <p className="hp-eyebrow dark">Descobrir</p>
          <h2>O que quer fazer?</h2>
          <p className="hp-section-lead">Escolha uma secção — cada uma abre numa página organizada.</p>
        </div>

        <div className="hp-quick-actions">
          {homeQuickActions.map((item) => (
            <Link key={item.to} className="hp-quick-action" to={item.to}>
              <HomeIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="hp-hub-grid">
          {homeHubSections.map((item) => (
            <Link key={item.to} className="hp-hub-card" to={item.to}>
              <span className="hp-hub-card-icon" aria-hidden="true">
                <HomeIcon name={item.icon} />
              </span>
              <span className="hp-hub-card-text">
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </span>
              <span className="hp-hub-card-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
