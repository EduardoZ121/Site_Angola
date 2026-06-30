import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'
import { ACCOUNT_SECTION_LINKS } from '../../utils/account'

export function AccountQuickNav({ showVisits = false }) {
  const links = showVisits
    ? [
        { id: 'visitas', label: 'Visitas', icon: 'clock' },
        ...ACCOUNT_SECTION_LINKS,
      ]
    : ACCOUNT_SECTION_LINKS

  return (
    <nav className="account-quick-nav panel-card" aria-label="Secções da conta">
      <div className="account-quick-links">
        {links.map((item) => (
          <a key={item.id} className="account-quick-link" href={`#${item.id}`}>
            <HomeIcon name={item.icon} />
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
