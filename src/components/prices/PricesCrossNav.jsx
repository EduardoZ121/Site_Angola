import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'

const LINKS = [
  { to: '/comprar', label: 'Comprar', icon: 'home' },
  { to: '/arrendar', label: 'Arrendar', icon: 'building' },
  { to: '/explorar', label: 'Explorar', icon: 'search' },
  { to: '/comparar', label: 'Comparar', icon: 'columns' },
]

export function PricesCrossNav() {
  return (
    <nav className="prices-cross-nav panel-card" aria-label="Explorar catálogo">
      <span className="prices-cross-label">Ir para:</span>
      <div className="prices-cross-links">
        {LINKS.map((item) => (
          <Link key={item.to} className="prices-cross-link" to={item.to}>
            <HomeIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
