export function PublishBottomBar({
  stepIndex,
  totalSteps,
  completion,
  isLast,
  onBack,
  onNext,
  onPublish,
  editMode,
  canGoBack,
}) {
  return (
    <footer className="publish-bottom-bar">
      <div className="publish-bottom-bar-inner">
        <button type="button" className="publish-bottom-back" onClick={onBack} disabled={!canGoBack}>
          ← Anterior
        </button>

        <div className="publish-bottom-center">
          <strong>{completion}%</strong>
          <span>
            Etapa {stepIndex + 1} de {totalSteps}
          </span>
        </div>

        {isLast ? (
          <button type="button" className="button primary publish-bottom-next" onClick={onPublish}>
            {editMode ? 'Guardar alterações' : 'Publicar anúncio →'}
          </button>
        ) : (
          <button type="button" className="button primary publish-bottom-next" onClick={onNext}>
            Seguinte →
          </button>
        )}
      </div>
    </footer>
  )
}
