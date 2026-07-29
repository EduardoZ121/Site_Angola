import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'
import { ADMIN_CROSS_LINKS } from '../../utils/admin'

export function AdminCrossNav() {
  return (
    <nav className="admin-cross-nav panel-card" aria-label="Atalhos do administrador">
      <span className="admin-cross-label">Ir para:</span>
      <div className="admin-cross-links">
        {ADMIN_CROSS_LINKS.map((item) => (
          <Link key={item.to} className="admin-cross-link" to={item.to}>
            <HomeIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
