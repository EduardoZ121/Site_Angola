import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'
import { OWNER_CROSS_LINKS } from '../../utils/ownerDashboard'

export function OwnerCrossNav() {
  return (
    <nav className="owner-cross-nav panel-card" aria-label="Atalhos do painel">
      <span className="owner-cross-label">Ir para:</span>
      <div className="owner-cross-links">
        {OWNER_CROSS_LINKS.map((item) => (
          <Link key={item.to} className="owner-cross-link" to={item.to}>
            <HomeIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
