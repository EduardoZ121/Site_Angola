import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { GoogleAuthButton } from '../components/GoogleAuthButton'
import { useMarketplace } from '../context/MarketplaceContext'

const loginMessages = {
  '/publicar': 'Entre para publicar o seu imóvel ou veículo.',
  '/adicionar-propriedade': 'Entre para adicionar a sua propriedade.',
  '/adicionar-propriedade/detalhes': 'Entre para completar os detalhes da propriedade.',
  '/favoritos': 'Entre para guardar anúncios nos favoritos.',
  '/comparar': 'Entre para comparar anúncios.',
  '/conta': 'Entre para aceder à sua conta e mensagens.',
  '/admin': 'Área reservada ao administrador Kuteka.',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile, loginWithGoogle, isLoggedIn } = useMarketplace()
  const redirectTo = searchParams.get('redirect') || '/conta'
  const loginHint = loginMessages[redirectTo.split('?')[0]] || 'Entre com Google para continuar no Kuteka.'

  useEffect(() => {
    if (isLoggedIn) navigate(redirectTo, { replace: true })
  }, [isLoggedIn, navigate, redirectTo])

  function handleGoogleCredential(credential) {
    const ok = loginWithGoogle(credential)
    if (ok) navigate(redirectTo, { replace: true })
  }

  if (isLoggedIn) return null

  return (
    <div className="login-screen">
      <div className="login-screen-panel login-screen-brand">
        <Link className="login-brand-link" to="/">
          <img className="brand-logo" src="/kuteka-logo.svg" alt="Kuteka" />
        </Link>
        <p className="eyebrow eyebrow-light">Kuteka • Angola</p>
        <h1>Bem-vindo de volta</h1>
        <p className="login-brand-text">
          Compre, arrende ou publique imóveis e veículos em Angola. A sua conta Google liga
          notificações, favoritos e publicações.
        </p>
        <ul className="login-brand-list">
          <li>Ver casas e carros sem login</li>
          <li>Login obrigatório para publicar ou guardar favoritos</li>
          <li>Anúncios aprovados pelo administrador</li>
        </ul>
        <Link className="login-back-home" to="/">
          ← Voltar ao site
        </Link>
      </div>

      <div className="login-screen-panel login-screen-form">
        <div className="login-form-card">
          <p className="eyebrow">Conta Google</p>
          <h2>Entrar ou criar conta</h2>
          <p className="login-form-lead">{loginHint}</p>

          <GoogleAuthButton onCredential={handleGoogleCredential} />

          <div className="login-form-notes">
            <p>✉ Recebe emails quando o anúncio for aprovado</p>
            <p>🔐 Sem palavra-passe extra — usa a conta Google</p>
            <p>🏠 Senhorios e compradores usam a mesma entrada</p>
          </div>
        </div>
      </div>
    </div>
  )
}
