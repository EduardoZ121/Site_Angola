import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'

export function RootRedirect() {
  return <Navigate to="/inicio" replace />
}

export function RequireAuth() {
  const { isLoggedIn } = useMarketplace()
  const location = useLocation()

  if (!isLoggedIn) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/entrar?redirect=${redirect}`} replace />
  }

  return <Outlet />
}

/** Exige perfil escolhido antes de publicar ou gerir anúncios. */
export function RequireRoleForPublish() {
  const { isLoggedIn, needsRoleSelection } = useMarketplace()
  const location = useLocation()

  if (!isLoggedIn) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/entrar?redirect=${redirect}`} replace />
  }

  if (needsRoleSelection) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/escolher-perfil?redirect=${redirect}`} replace />
  }

  return <Outlet />
}

export function RequireAdmin() {
  const { isLoggedIn, isAdmin } = useMarketplace()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to={`/entrar?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/inicio" replace />
  }

  return <Outlet />
}

export function RequireStaff() {
  const { isLoggedIn, isStaff } = useMarketplace()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to={`/entrar?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (!isStaff) {
    return <Navigate to="/inicio" replace />
  }

  return <Outlet />
}
