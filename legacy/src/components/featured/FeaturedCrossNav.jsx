import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'

const LINKS = [
  { to: '/comprar', label: 'Comprar', icon: 'home' },
  { to: '/arrendar', label: 'Arrendar', icon: 'building' },
  { to: '/veiculos', label: 'Veículos', icon: 'car' },
  { to: '/explorar', label: 'Explorar', icon: 'search' },
]

export function FeaturedCrossNav() {
  return (
    <nav className="featured-cross-nav panel-card" aria-label="Explorar catálogo">
      <span className="featured-cross-label">Ver catálogo completo:</span>
      <div className="featured-cross-links">
        {LINKS.map((item) => (
          <Link key={item.to} className="featured-cross-link" to={item.to}>
            <HomeIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
