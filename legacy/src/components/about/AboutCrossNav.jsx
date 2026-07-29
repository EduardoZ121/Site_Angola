import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'

const LINKS = [
  { to: '/como-funciona', label: 'Como funciona', icon: 'handshake' },
  { to: '/explorar', label: 'Explorar', icon: 'search' },
  { to: '/precos', label: 'Preços por zona', icon: 'chart' },
  { to: '/destaques', label: 'Destaques', icon: 'bolt' },
]

export function AboutCrossNav() {
  return (
    <nav className="about-cross-nav panel-card" aria-label="Explorar Kuteka">
      <span className="about-cross-label">Continuar:</span>
      <div className="about-cross-links">
        {LINKS.map((item) => (
          <Link key={item.to} className="about-cross-link" to={item.to}>
            <HomeIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
