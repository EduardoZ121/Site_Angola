import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'

const mainNav = [
  { to: '/comprar', label: 'Comprar' },
  { to: '/arrendar', label: 'Arrendar' },
  { to: '/veiculos', label: 'Veículos' },
  { to: '/publicar', label: 'Publicar' },
]

const accountNav = [
  { to: '/favoritos', label: 'Favoritos' },
  { to: '/comparar', label: 'Comparar' },
  { to: '/precos', label: 'Preços' },
]

export function Layout() {
  const { favorites, compare, profile, isLoggedIn, isAdmin, logoutAccount } = useMarketplace()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const isHome = location.pathname === '/'

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div className="site-shell">
      <header className={`site-header ${isHome ? 'site-header-home' : 'site-header-inner-page'}`}>
        <div className="site-header-bar">
          <NavLink className="brand" to="/" aria-label="Kuteka início" onClick={closeMenu}>
            <img className="brand-logo" src="/kuteka-logo.svg" alt="Kuteka" />
          </NavLink>

          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-label="Abrir menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            ☰
          </button>

          <nav className={`site-nav ${menuOpen ? 'open' : ''}`} aria-label="Navegação principal">
            <div className="nav-group">
              <p className="nav-group-label">Marketplace</p>
              {mainNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                  onClick={closeMenu}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="nav-group">
              <p className="nav-group-label">Conta</p>
              {isLoggedIn && profile.picture ? (
                <img className="nav-user-avatar" src={profile.picture} alt="" />
              ) : null}
              {isLoggedIn ? (
                <NavLink
                  to="/conta"
                  className={({ isActive }) => (isActive ? 'nav-link subtle active' : 'nav-link subtle')}
                  onClick={closeMenu}
                >
                  {profile.name?.split(' ')[0] || 'Conta'}
                </NavLink>
              ) : (
                <NavLink
                  to="/entrar"
                  className={({ isActive }) => (isActive ? 'nav-link subtle active' : 'nav-link subtle')}
                  onClick={closeMenu}
                >
                  Entrar
                </NavLink>
              )}
              {isAdmin ? (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => (isActive ? 'nav-link subtle active' : 'nav-link subtle')}
                  onClick={closeMenu}
                >
                  Admin
                </NavLink>
              ) : null}
              {accountNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'nav-link subtle active' : 'nav-link subtle')}
                  onClick={closeMenu}
                >
                  {item.label}
                  {item.to === '/favoritos' && favorites.length > 0 ? ` (${favorites.length})` : ''}
                  {item.to === '/comparar' && compare.length > 0 ? ` (${compare.length})` : ''}
                </NavLink>
              ))}
              {isLoggedIn ? (
                <button className="nav-link subtle nav-logout" type="button" onClick={logoutAccount}>
                  Sair
                </button>
              ) : null}
            </div>
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
            <NavLink to="/publicar">Publicar</NavLink>
            {isAdmin ? <NavLink to="/admin">Admin</NavLink> : null}
          </div>
        </div>
      </footer>
    </div>
  )
}
