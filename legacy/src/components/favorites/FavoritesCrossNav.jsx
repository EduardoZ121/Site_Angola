import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'

const LINKS = [
  { to: '/comprar', label: 'Comprar', icon: 'home' },
  { to: '/arrendar', label: 'Arrendar', icon: 'building' },
  { to: '/veiculos', label: 'Veículos', icon: 'car' },
  { to: '/explorar', label: 'Explorar', icon: 'search' },
]

export function FavoritesCrossNav() {
  return (
    <nav className="favorites-cross-nav panel-card" aria-label="Explorar marketplace">
      <span className="favorites-cross-label">Continuar a pesquisar:</span>
      <div className="favorites-cross-links">
        {LINKS.map((item) => (
          <Link key={item.to} className="favorites-cross-link" to={item.to}>
            <HomeIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
