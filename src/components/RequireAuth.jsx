import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'

export function RootRedirect() {
  const { getDefaultRoute } = useMarketplace()
  return <Navigate to={getDefaultRoute()} replace />
}

export function RequireAuth() {
  const { isLoggedIn } = useMarketplace()
  const location = useLocation()

  if (!isLoggedIn) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/cadastro?redirect=${redirect}`} replace />
  }

  return <Outlet />
}

export function RequireOnboarding() {
  const { isLoggedIn, needsRoleSelection, needsBuyerFlow } = useMarketplace()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/cadastro" replace />
  }

  if (needsRoleSelection && location.pathname !== '/escolher-perfil') {
    return <Navigate to="/escolher-perfil" replace />
  }

  if (needsBuyerFlow && location.pathname !== '/procurar') {
    return <Navigate to="/procurar" replace />
  }

  if (!needsRoleSelection && location.pathname === '/escolher-perfil') {
    return <Navigate to="/inicio" replace />
  }

  return <Outlet />
}

export function RequireAdmin() {
  const { isLoggedIn } = useMarketplace()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to={`/cadastro?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  return <Outlet />
}
