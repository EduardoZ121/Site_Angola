import { useNavigate } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'

export function useRequireLogin() {
  const navigate = useNavigate()
  const { isLoggedIn } = useMarketplace()

  return function requireLogin(action, redirectPath) {
    const target = redirectPath || window.location.pathname

    if (!isLoggedIn) {
      navigate(`/cadastro?redirect=${encodeURIComponent(target)}`)
      return false
    }

    if (action) action()
    return true
  }
}
