import { getRedirectLabel } from '../../utils/auth'

export function AuthRedirectBanner({ redirectPath }) {
  const label = getRedirectLabel(redirectPath)
  if (!label) return null

  return (
    <p className="auth-redirect-banner" role="status">
      Depois de entrar, voltará a <strong>{label}</strong>.
    </p>
  )
}
