import { homeBenefits } from '../../data/homeContent'
import { HomeIcon } from '../icons/HomeIcon'

export function BenefitsSection() {
  return (
    <section className="hp-section hp-section-muted">
      <div className="hp-container">
        <div className="hp-section-head">
          <p className="hp-eyebrow dark">Confiança</p>
          <h2>Porquê escolher a Kuteka</h2>
          <p className="hp-section-lead">
            Uma plataforma pensada para Angola — clara, segura e fácil de usar.
          </p>
        </div>
        <div className="hp-benefits-grid">
          {homeBenefits.map((item) => (
            <article className="hp-benefit-card" key={item.title}>
              <span className="hp-benefit-icon" aria-hidden="true">
                <HomeIcon name={item.icon} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
