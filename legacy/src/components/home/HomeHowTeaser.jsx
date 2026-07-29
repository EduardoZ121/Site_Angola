import { Link } from 'react-router-dom'
import { homeOwnerSteps, homeSteps } from '../../data/homeContent'
import { HomeIcon } from '../icons/HomeIcon'

export function HomeHowTeaser() {
  return (
    <section className="hp-section hp-section-muted">
      <div className="hp-container">
        <div className="hp-section-head">
          <p className="hp-eyebrow dark">Simples</p>
          <h2>Como funciona</h2>
          <p className="hp-section-lead">Três passos para quem procura e três para quem publica.</p>
        </div>
        <div className="hp-how-teaser-grid">
          <div className="hp-how-teaser-col">
            <h3>Comprador</h3>
            <ol className="hp-how-teaser-steps">
              {homeSteps.map((step) => (
                <li key={step.title}>
                  <HomeIcon name={step.icon} />
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="hp-how-teaser-col">
            <h3>Proprietário</h3>
            <ol className="hp-how-teaser-steps">
              {homeOwnerSteps.map((step) => (
                <li key={step.title}>
                  <HomeIcon name={step.icon} />
                  <div>
                    <strong>{step.title}</strong>
                    <p>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="hp-how-teaser-actions">
          <Link className="hp-btn hp-btn-primary" to="/como-funciona">
            Ver guia completo
          </Link>
          <Link className="hp-btn hp-btn-secondary hp-btn-on-light" to="/publicar">
            Publicar anúncio
          </Link>
        </div>
      </div>
    </section>
  )
}
