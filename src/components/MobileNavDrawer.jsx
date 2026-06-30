import { NavLink } from 'react-router-dom'
import { HomeIcon } from './icons/HomeIcon'

function NavRow({ to, icon, children, onClick, end = false }) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) => `mobile-nav-row${isActive ? ' active' : ''}`}
        onClick={onClick}
      >
        <span className="mobile-nav-row-icon" aria-hidden="true">
          <HomeIcon name={icon} />
        </span>
        <span className="mobile-nav-row-label">{children}</span>
      </NavLink>
    </li>
  )
}

function NavAction({ icon, children, onClick }) {
  return (
    <li>
      <button type="button" className="mobile-nav-row mobile-nav-row-button" onClick={onClick}>
        <span className="mobile-nav-row-icon" aria-hidden="true">
          <HomeIcon name={icon} />
        </span>
        <span className="mobile-nav-row-label">{children}</span>
      </button>
    </li>
  )
}

export function MobileNavDrawer({
  open,
  onClose,
  isLoggedIn,
  isAdmin,
  profile,
  favoritesCount,
  compareCount,
  onLogout,
}) {
  const initials = profile.name
    ? profile.name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : 'K'

  return (
    <>
      <button
        type="button"
        className={`mobile-nav-backdrop${open ? ' open' : ''}`}
        aria-label="Fechar menu"
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />

      <aside
        className={`mobile-nav-drawer${open ? ' open' : ''}`}
        aria-hidden={!open}
        aria-label="Menu Kuteka"
      >
        <div className="mobile-nav-head">
          {isLoggedIn ? (
            <div className="mobile-nav-user">
              {profile.picture ? (
                <img className="mobile-nav-avatar" src={profile.picture} alt="" />
              ) : (
                <span className="mobile-nav-initials">{initials}</span>
              )}
              <div className="mobile-nav-user-text">
                <strong>{profile.name || 'Conta Kuteka'}</strong>
                <span>{profile.email || 'Marketplace Angola'}</span>
              </div>
            </div>
          ) : (
            <div className="mobile-nav-user">
              <span className="mobile-nav-initials">K</span>
              <div className="mobile-nav-user-text">
                <strong>Kuteka</strong>
                <span>Imóveis e veículos em Angola</span>
              </div>
            </div>
          )}
          <button type="button" className="mobile-nav-close" aria-label="Fechar" onClick={onClose}>
            <HomeIcon name="x" />
          </button>
        </div>

        <nav className="mobile-nav-body">
          <ul className="mobile-nav-list">
            <NavRow to="/comprar" icon="home" onClick={onClose}>
              Comprar imóveis
            </NavRow>
            <NavRow to="/arrendar" icon="building" onClick={onClose}>
              Arrendar imóveis
            </NavRow>
            <NavRow to="/veiculos" icon="car" onClick={onClose}>
              Veículos
            </NavRow>
            <NavRow to="/publicar" icon="edit" onClick={onClose}>
              Publicar anúncio
            </NavRow>
          </ul>

          <hr className="mobile-nav-divider" />

          <ul className="mobile-nav-list">
            {isLoggedIn ? (
              <NavRow to="/conta" icon="user" onClick={onClose}>
                Minha conta
              </NavRow>
            ) : (
              <NavRow to="/entrar" icon="user" onClick={onClose}>
                Entrar
              </NavRow>
            )}
            <NavRow to="/painel" icon="grid" onClick={onClose}>
              Painel
            </NavRow>
            <NavRow to="/favoritos" icon="heart" onClick={onClose}>
              Favoritos{favoritesCount > 0 ? ` (${favoritesCount})` : ''}
            </NavRow>
            <NavRow to="/comparar" icon="columns" onClick={onClose}>
              Comparar{compareCount > 0 ? ` (${compareCount})` : ''}
            </NavRow>
            <NavRow to="/precos" icon="tag" onClick={onClose}>
              Preços por zona
            </NavRow>
          </ul>

          <hr className="mobile-nav-divider" />

          <ul className="mobile-nav-list">
            {isAdmin ? (
              <NavRow to="/admin" icon="shield" onClick={onClose}>
                Administrador
              </NavRow>
            ) : null}
            {!isLoggedIn ? (
              <NavRow to="/cadastro" icon="edit" onClick={onClose}>
                Criar conta
              </NavRow>
            ) : null}
            {isLoggedIn ? (
              <NavAction
                icon="logout"
                onClick={() => {
                  onLogout()
                  onClose()
                }}
              >
                Terminar sessão
              </NavAction>
            ) : null}
          </ul>
        </nav>
      </aside>
    </>
  )
}
