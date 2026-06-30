import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'
import { ACCOUNT_CROSS_LINKS } from '../../utils/account'

export function AccountCrossNav() {
  return (
    <nav className="account-cross-nav panel-card" aria-label="Atalhos da conta">
      <span className="account-cross-label">Ir para:</span>
      <div className="account-cross-links">
        {ACCOUNT_CROSS_LINKS.map((item) => (
          <Link key={item.to} className="account-cross-link" to={item.to}>
            <HomeIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
