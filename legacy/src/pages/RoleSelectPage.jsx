import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthCrossNav } from '../components/auth/AuthCrossNav'
import { AuthRedirectBanner } from '../components/auth/AuthRedirectBanner'
import { HelpTip } from '../components/ui/HelpTip'
import { userRoles } from '../data/constants'
import { useMarketplace } from '../context/MarketplaceContext'
import { HomeIcon } from '../components/icons/HomeIcon'
import { buildAuthPath } from '../hooks/useAuthRedirect'
import { safeRedirectPath } from '../utils/auth'

export default function RoleSelectPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isLoggedIn, setUserRole, needsRoleSelection, logoutAccount } = useMarketplace()

  const redirectParam = safeRedirectPath(searchParams.get('redirect'))
  const redirectTo = redirectParam || '/inicio'

  useEffect(() => {
    document.title = 'Escolher perfil | Kuteka'
  }, [])

  useEffect(() => {
    if (!isLoggedIn) {
      navigate(buildAuthPath('/entrar', redirectParam), { replace: true })
    } else if (!needsRoleSelection) {
      navigate(redirectTo, { replace: true })
    }
  }, [isLoggedIn, needsRoleSelection, navigate, redirectParam, redirectTo])

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

        {redirectParam ? <AuthRedirectBanner redirectPath={redirectParam} /> : null}

        <p className="eyebrow">Antes de continuar</p>
        <h1>
          Como pretende usar o Kuteka?
          <HelpTip
            label="Perfis Kuteka"
            text="Comprador: procura e guarda anúncios. Proprietário: publica imóveis ou veículos. Pode alterar depois na conta."
          />
        </h1>
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

        <AuthCrossNav />

        <div className="onboarding-actions">
          <button className="auth-text-button" type="button" onClick={logoutAccount}>
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}
