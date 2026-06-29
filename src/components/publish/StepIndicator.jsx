export function StepIndicator({ steps, currentIndex, completion, onStepClick }) {
  return (
    <div className="publish-step-indicator">
      <div className="publish-progress-meta">
        <span>{completion}% concluído</span>
        <span>
          Passo {currentIndex + 1} de {steps.length}
        </span>
      </div>
      <div className="publish-progress-bar" aria-hidden="true">
        <span style={{ width: `${completion}%` }} />
      </div>
      <ol className="publish-steps-list">
        {steps.map((step, index) => (
          <li key={step.id}>
            <button
              type="button"
              className={`publish-step-pill ${index === currentIndex ? 'active' : ''} ${index < currentIndex ? 'done' : ''}`}
              onClick={() => onStepClick?.(index)}
              disabled={index > currentIndex}
            >
              {index + 1}. {step.label}
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
