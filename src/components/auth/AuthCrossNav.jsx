import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'
import { AUTH_CROSS_LINKS } from '../../utils/auth'

export function AuthCrossNav({ className = '' }) {
  return (
    <nav className={`auth-cross-nav ${className}`.trim()} aria-label="Links úteis">
      {AUTH_CROSS_LINKS.map((item) => (
        <Link key={item.to} className="auth-cross-link" to={item.to}>
          <HomeIcon name={item.icon} />
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
