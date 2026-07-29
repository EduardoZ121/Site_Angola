import { HomeIcon } from '../icons/HomeIcon'
import { ADMIN_SECTION_LINKS } from '../../utils/admin'

export function AdminQuickNav() {
  return (
    <nav className="admin-quick-nav panel-card" aria-label="Secções do admin">
      <div className="admin-quick-links">
        {ADMIN_SECTION_LINKS.map((item) => (
          <a key={item.id} className="admin-quick-link" href={`#${item.id}`}>
            <HomeIcon name={item.icon} />
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
