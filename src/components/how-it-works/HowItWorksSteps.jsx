import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'

export function HowItWorksSteps({ steps, roleLabel }) {
  if (!steps?.length) return null

  return (
    <section className="hiw-steps-section" aria-label={`Passos — ${roleLabel}`}>
      <ol className="hiw-steps-list">
        {steps.map((step, index) => (
          <li key={step.title} className="hiw-step-card panel-card">
            <span className="hiw-step-num">{index + 1}</span>
            <span className="hiw-step-icon" aria-hidden="true">
              <HomeIcon name={step.icon} />
            </span>
            <div className="hiw-step-body">
              <h3>{step.title}</h3>
              <p>{step.description}</p>
              {step.to && step.actionLabel ? (
                <Link className="text-button hiw-step-link" to={step.to}>
                  {step.actionLabel} →
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
