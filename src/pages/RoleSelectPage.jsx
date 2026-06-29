import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { userRoles } from '../data/constants'
import { useMarketplace } from '../context/MarketplaceContext'
import { HomeIcon } from '../components/icons/HomeIcon'

function safeRedirectPath(value) {
  if (!value) return '/inicio'
  try {
    const decoded = decodeURIComponent(value)
    if (decoded.startsWith('/') && !decoded.startsWith('//')) return decoded
  } catch {
    return '/inicio'
  }
  return '/inicio'
}

export default function RoleSelectPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isLoggedIn, setUserRole, needsRoleSelection, logoutAccount } = useMarketplace()

  const redirectTo = safeRedirectPath(searchParams.get('redirect'))

  useEffect(() => {
    if (!isLoggedIn) navigate('/entrar', { replace: true })
    else if (!needsRoleSelection) navigate(redirectTo, { replace: true })
  }, [isLoggedIn, needsRoleSelection, navigate, redirectTo])

  function chooseOwner() {
    setUserRole(userRoles.owner)
    navigate(redirectTo, { replace: true })
  }

  function chooseBuyer() {
    setUserRole(userRoles.buyer)
    navigate(redirectTo === '/inicio' ? '/procurar' : redirectTo, { replace: true })
  }

  if (!isLoggedIn || !needsRoleSelection) return null

  return (
    <div className="onboarding-screen">
      <div className="onboarding-card onboarding-wide">
        <Link to="/inicio" aria-label="Kuteka">
          <img className="onboarding-logo" src="/kuteka-logo.svg" alt="Kuteka" />
        </Link>
        <p className="eyebrow">Antes de continuar</p>
        <h1>Como pretende usar o Kuteka?</h1>
        <p className="onboarding-lead">
          Escolha o perfil que melhor se adapta à acção que quer fazer. Pode alterar mais tarde na
          conta.
        </p>

        <div className="role-grid">
          <button className="role-card" type="button" onClick={chooseBuyer}>
            <span className="role-icon" aria-hidden="true">
              <HomeIcon name="search" />
            </span>
            <strong>Quero comprar ou arrendar</strong>
            <span>Casas, terrenos, carros e outros anúncios em Angola.</span>
            <em className="role-card-cta">Continuar</em>
          </button>

          <button className="role-card role-card-owner" type="button" onClick={chooseOwner}>
            <span className="role-icon" aria-hidden="true">
              <HomeIcon name="home" />
            </span>
            <strong>Quero anunciar imóveis ou veículos</strong>
            <span>Publicar anúncios e receber contactos de interessados.</span>
            <em className="role-card-cta">Continuar</em>
          </button>
        </div>

        <div className="onboarding-actions">
          <button className="auth-text-button" type="button" onClick={logoutAccount}>
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}
