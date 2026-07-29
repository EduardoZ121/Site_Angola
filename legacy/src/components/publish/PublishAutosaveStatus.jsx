import { HomeIcon } from '../icons/HomeIcon'

export function PublishAutosaveStatus({ savedLabel }) {
  if (!savedLabel) return null

  return (
    <div className="publish-autosave-status" aria-live="polite">
      <HomeIcon name="refresh" />
      <div>
        <strong>Guardado automaticamente</strong>
        <span>Última actualização: {savedLabel}</span>
      </div>
    </div>
  )
}
