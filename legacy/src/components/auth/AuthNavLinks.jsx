import { Link } from 'react-router-dom'

export function AuthNavLinks({ primary, secondary }) {
  return (
    <div className="auth-nav-links">
      {primary ? (
        <Link className="auth-nav-link" to={primary.to}>
          {primary.label}
        </Link>
      ) : null}
      {secondary ? (
        <Link className="auth-nav-link subtle" to={secondary.to}>
          {secondary.label}
        </Link>
      ) : null}
    </div>
  )
}
