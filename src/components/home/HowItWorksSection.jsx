import { homeOwnerSteps, homeSteps } from '../../data/homeContent'

export function HowItWorksSection() {
  return (
    <section className="hp-section">
      <div className="hp-container">
        <div className="hp-section-head center">
          <p className="hp-eyebrow dark">Simples</p>
          <h2>Como funciona</h2>
          <p className="hp-section-lead">Três passos para compradores e três para proprietários.</p>
        </div>
        <div className="hp-how-grid">
          <div className="hp-how-column">
            <h3 className="hp-how-title">Comprador</h3>
            <div className="hp-steps-grid compact">
              {homeSteps.map((step, index) => (
                <article className="hp-step-card" key={step.title}>
                  <span className="hp-step-num">{index + 1}</span>
                  <span className="hp-step-icon" aria-hidden="true">
                    {step.icon}
                  </span>
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="hp-how-column">
            <h3 className="hp-how-title">Proprietário</h3>
            <div className="hp-steps-grid compact">
              {homeOwnerSteps.map((step, index) => (
                <article className="hp-step-card" key={step.title}>
                  <span className="hp-step-num">{index + 1}</span>
                  <span className="hp-step-icon" aria-hidden="true">
                    {step.icon}
                  </span>
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
