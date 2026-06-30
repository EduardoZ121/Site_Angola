import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { MenuIcon } from './icons/HomeIcon'
import { MobileNavDrawer } from './MobileNavDrawer'

const mainNav = [
  { to: '/comprar', label: 'Comprar' },
  { to: '/arrendar', label: 'Arrendar' },
  { to: '/veiculos', label: 'Veículos' },
  { to: '/publicar', label: 'Publicar' },
]

const accountNav = [
  { to: '/painel', label: 'Painel' },
  { to: '/favoritos', label: 'Favoritos' },
  { to: '/comparar', label: 'Comparar' },
  { to: '/precos', label: 'Preços' },
]

export function Layout() {
  const { favorites, compare, profile, isLoggedIn, isAdmin, isAgent, staffBadges, logoutAccount } =
    useMarketplace()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [headerScrolled, setHeaderScrolled] = useState(false)
  const isHome = location.pathname === '/inicio'

  useEffect(() => {
    if (!isHome) {
      setHeaderScrolled(true)
      return undefined
    }
    setHeaderScrolled(false)
    function onScroll() {
      setHeaderScrolled(window.scrollY > 24)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [menuOpen])

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div className="site-shell">
      <header
        className={`site-header ${isHome ? 'site-header-home site-header-home-inicio' : 'site-header-inner-page'} ${headerScrolled ? 'site-header-scrolled' : ''}`}
      >
        <div className="site-header-bar">
          <NavLink className="brand" to="/inicio" aria-label="Kuteka início" onClick={closeMenu}>
            <img
              className="brand-logo"
              src={isHome && !headerScrolled ? '/kuteka-logo-hero.svg' : '/kuteka-logo.svg'}
              alt="Kuteka"
            />
          </NavLink>

          <button
            type="button"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon />
          </button>

          <nav className="site-nav desktop-nav" aria-label="Navegação principal">
            <div className="nav-group">
              <p className="nav-group-label">Marketplace</p>
              {mainNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
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
                >
                  {profile.name?.split(' ')[0] || 'Conta'}
                </NavLink>
              ) : (
                <NavLink
                  to="/entrar"
                  className={({ isActive }) => (isActive ? 'nav-link subtle active' : 'nav-link subtle')}
                >
                  Entrar
                </NavLink>
              )}
              {isAdmin ? (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => (isActive ? 'nav-link subtle active' : 'nav-link subtle')}
                >
                  Administrador
                  {staffBadges.adminTotal > 0 ? (
                    <span className="nav-badge">{staffBadges.adminTotal > 99 ? '99+' : staffBadges.adminTotal}</span>
                  ) : null}
                </NavLink>
              ) : null}
              {isAgent ? (
                <NavLink
                  to="/agente"
                  className={({ isActive }) => (isActive ? 'nav-link subtle active' : 'nav-link subtle')}
                >
                  Agente
                  {staffBadges.pendingListings > 0 ? (
                    <span className="nav-badge">
                      {staffBadges.pendingListings > 99 ? '99+' : staffBadges.pendingListings}
                    </span>
                  ) : null}
                </NavLink>
              ) : null}
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
              {isLoggedIn ? (
                <button className="nav-link subtle nav-logout" type="button" onClick={logoutAccount}>
                  Sair
                </button>
              ) : null}
            </div>
          </nav>
        </div>
      </header>

      <MobileNavDrawer
        open={menuOpen}
        onClose={closeMenu}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        isAgent={isAgent}
        profile={profile}
        favoritesCount={favorites.length}
        compareCount={compare.length}
        staffBadges={staffBadges}
        onLogout={logoutAccount}
      />

      <Outlet />

      {!isHome ? (
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
              {isAdmin ? <NavLink to="/admin">Administrador</NavLink> : null}
              {isAgent ? <NavLink to="/agente">Agente</NavLink> : null}
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  )
}
