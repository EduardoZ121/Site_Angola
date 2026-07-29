import { Link } from 'react-router-dom'

export function AuthGuestLink() {
  return (
    <p className="auth-guest-link">
      <Link to="/explorar">Continuar a explorar sem conta</Link>
    </p>
  )
}
