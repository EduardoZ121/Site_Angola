export function PublishTimeline({ steps, currentIndex, completion, onStepClick }) {
  return (
    <nav className="publish-timeline" aria-label="Progresso da publicação">
      <div className="publish-timeline-meta">
        <span className="publish-timeline-pct">{completion}% concluído</span>
        <span className="publish-timeline-count">
          Etapa {currentIndex + 1} de {steps.length}
        </span>
      </div>

      <div className="publish-timeline-track" aria-hidden="true">
        <span className="publish-timeline-fill" style={{ width: `${completion}%` }} />
      </div>

      <ol className="publish-timeline-steps">
        {steps.map((step, index) => {
          const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'future'
          return (
            <li key={step.id} className={`publish-timeline-step publish-timeline-step-${state}`}>
              <button
                type="button"
                className="publish-timeline-btn"
                disabled={index > currentIndex}
                onClick={() => onStepClick?.(index)}
                aria-current={index === currentIndex ? 'step' : undefined}
              >
                <span className="publish-timeline-dot" aria-hidden="true">
                  {state === 'done' ? '✓' : state === 'current' ? '●' : '○'}
                </span>
                <span className="publish-timeline-label">{step.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
