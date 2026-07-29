import { useLoginPrompt } from '../context/LoginPromptContext'
import { useMarketplace } from '../context/MarketplaceContext'

export function useRequireLogin() {
  const { isLoggedIn } = useMarketplace()
  const { openLoginPrompt } = useLoginPrompt()

  return function requireLogin(action, redirectPath) {
    const target = redirectPath || `${window.location.pathname}${window.location.search}`

    if (isLoggedIn) {
      if (action) action()
      return true
    }

    openLoginPrompt({ redirectPath: target, onSuccess: action })
    return false
  }
}
