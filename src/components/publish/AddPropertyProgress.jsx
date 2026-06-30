export function AddPropertyProgress({ step, total = 2 }) {
  const percent = Math.round((step / total) * 100)

  return (
    <div className="add-property-progress panel-card" aria-label={`Passo ${step} de ${total}`}>
      <div className="add-property-progress-head">
        <strong>
          Passo {step} de {total}
        </strong>
        <span>{percent}%</span>
      </div>
      <div className="add-property-progress-track" aria-hidden="true">
        <span className="add-property-progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
