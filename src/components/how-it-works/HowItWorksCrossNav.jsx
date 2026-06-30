import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'

const LINKS = [
  { to: '/explorar', label: 'Explorar', icon: 'search' },
  { to: '/publicar', label: 'Publicar', icon: 'edit' },
  { to: '/destaques', label: 'Destaques', icon: 'bolt' },
  { to: '/sobre', label: 'Sobre', icon: 'shield' },
]

export function HowItWorksCrossNav() {
  return (
    <nav className="hiw-cross-nav panel-card" aria-label="Ligações relacionadas">
      <span className="hiw-cross-label">Ir para:</span>
      <div className="hiw-cross-links">
        {LINKS.map((item) => (
          <Link key={item.to} className="hiw-cross-link" to={item.to}>
            <HomeIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
