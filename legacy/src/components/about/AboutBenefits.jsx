import { homeBenefits } from '../../data/homeContent'
import { HomeIcon } from '../icons/HomeIcon'

export function AboutBenefits() {
  return (
    <section className="about-benefits panel-card" aria-labelledby="about-benefits-title">
      <h2 id="about-benefits-title" className="about-section-title">
        Porquê a Kuteka
      </h2>
      <ul className="about-benefits-grid">
        {homeBenefits.map((item) => (
          <li key={item.title} className="about-benefit-item">
            <span className="about-benefit-icon" aria-hidden="true">
              <HomeIcon name={item.icon} />
            </span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
