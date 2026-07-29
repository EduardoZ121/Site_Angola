import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import { safeRedirectPath } from '../utils/auth'

export function useAuthRedirect({ skipRoleCheck = false } = {}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isLoggedIn, needsRoleSelection } = useMarketplace()

  const redirectParam = safeRedirectPath(searchParams.get('redirect'))

  useEffect(() => {
    if (!isLoggedIn) return

    if (needsRoleSelection && !skipRoleCheck) {
      navigate(buildAuthPath('/escolher-perfil', redirectParam), { replace: true })
      return
    }

    navigate(redirectParam || '/inicio', { replace: true })
  }, [isLoggedIn, needsRoleSelection, redirectParam, navigate, skipRoleCheck])

  return { redirectParam }
}

export function buildAuthPath(basePath, redirectPath) {
  if (!redirectPath) return basePath
  return `${basePath}?redirect=${encodeURIComponent(redirectPath)}`
}

export function buildRecoveryPath(token, redirectPath) {
  const params = new URLSearchParams({ token })
  if (redirectPath) params.set('redirect', redirectPath)
  return `/recuperar-senha?${params.toString()}`
}

export { safeRedirectPath }
