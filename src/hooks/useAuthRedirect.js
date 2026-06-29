import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'

function safeRedirectPath(value) {
  if (!value) return null
  try {
    const decoded = decodeURIComponent(value)
    if (decoded.startsWith('/') && !decoded.startsWith('//')) return decoded
  } catch {
    return null
  }
  return null
}

export function useAuthRedirect() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isLoggedIn } = useMarketplace()

  const redirectParam = safeRedirectPath(searchParams.get('redirect'))

  useEffect(() => {
    if (!isLoggedIn) return
    navigate(redirectParam || '/inicio', { replace: true })
  }, [isLoggedIn, redirectParam, navigate])

  return { redirectParam }
}

export function buildAuthPath(basePath, redirectPath) {
  if (!redirectPath) return basePath
  return `${basePath}?redirect=${encodeURIComponent(redirectPath)}`
}
