import { homeBenefits } from '../../data/homeContent'
import { HomeIcon } from '../icons/HomeIcon'
import { HelpTip } from '../ui/HelpTip'

export function HowItWorksBenefits() {
  return (
    <section className="hiw-benefits panel-card" aria-labelledby="hiw-benefits-title">
      <div className="hiw-benefits-head">
        <h2 id="hiw-benefits-title">Porquê a Kuteka</h2>
        <HelpTip
          label="Ajuda: confiança"
          text="Selos e verificação variam por anunciante — confirme documentos antes de fechar negócio."
        />
      </div>
      <ul className="hiw-benefits-grid">
        {homeBenefits.map((item) => (
          <li key={item.title} className="hiw-benefit-item">
            <span className="hiw-benefit-icon" aria-hidden="true">
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
