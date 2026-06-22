import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'

export function RequireAuth() {
  const { isLoggedIn } = useMarketplace()
  const location = useLocation()

  if (!isLoggedIn) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/entrar?redirect=${redirect}`} replace />
  }

  return <Outlet />
}

export function RequireAdmin() {
  const { isAdmin, isLoggedIn } = useMarketplace()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to={`/entrar?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
