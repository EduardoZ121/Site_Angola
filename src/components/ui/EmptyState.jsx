import { Link } from 'react-router-dom'

export function EmptyState({ title, description, actionLabel, actionTo, onAction }) {
  return (
    <div className="ui-empty-state panel-card">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {actionLabel && actionTo ? (
        <Link className="button primary" to={actionTo}>
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction ? (
        <button className="button primary" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
