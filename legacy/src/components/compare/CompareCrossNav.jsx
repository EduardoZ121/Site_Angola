import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'

const LINKS = [
  { to: '/comprar', label: 'Comprar', icon: 'home' },
  { to: '/arrendar', label: 'Arrendar', icon: 'building' },
  { to: '/veiculos', label: 'Veículos', icon: 'car' },
  { to: '/favoritos', label: 'Favoritos', icon: 'heart' },
]

export function CompareCrossNav() {
  return (
    <nav className="compare-cross-nav panel-card" aria-label="Adicionar anúncios à comparação">
      <span className="compare-cross-label">Adicionar da secção:</span>
      <div className="compare-cross-links">
        {LINKS.map((item) => (
          <Link key={item.to} className="compare-cross-link" to={item.to}>
            <HomeIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
