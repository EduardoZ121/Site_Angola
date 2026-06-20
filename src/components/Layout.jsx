import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'

const mainNav = [
  { to: '/comprar', label: 'Comprar' },
  { to: '/arrendar', label: 'Arrendar' },
  { to: '/veiculos', label: 'Veículos' },
  { to: '/publicar', label: 'Publicar' },
]

const accountNav = [
  { to: '/conta', label: 'Conta' },
  { to: '/favoritos', label: 'Favoritos' },
  { to: '/comparar', label: 'Comparar' },
  { to: '/precos', label: 'Preços' },
]

export function Layout() {
  const { favorites, compare } = useMarketplace()
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="site-shell">
      <header className={`site-header ${isHome ? 'site-header-hero' : 'site-header-compact'}`}>
        <div className="site-header-inner">
          <NavLink className="brand" to="/" aria-label="Kuteka início">
            <img className="brand-logo" src="/kuteka-logo.svg" alt="Kuteka" />
          </NavLink>

          <nav className="main-nav" aria-label="Navegação principal">
            {mainNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <nav className="account-nav" aria-label="Conta e ferramentas">
            {accountNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? 'nav-link subtle active' : 'nav-link subtle')}
              >
                {item.label}
                {item.to === '/favoritos' && favorites.length > 0 ? ` (${favorites.length})` : ''}
                {item.to === '/comparar' && compare.length > 0 ? ` (${compare.length})` : ''}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <Outlet />

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <strong>Kuteka</strong>
            <p>Marketplace de imóveis e veículos para Angola, em Kz.</p>
          </div>
          <div className="footer-links">
            <NavLink to="/comprar">Comprar</NavLink>
            <NavLink to="/arrendar">Arrendar</NavLink>
            <NavLink to="/veiculos">Veículos</NavLink>
            <NavLink to="/publicar">Publicar anúncio</NavLink>
            <NavLink to="/admin">Admin</NavLink>
          </div>
        </div>
      </footer>
    </div>
  )
}
