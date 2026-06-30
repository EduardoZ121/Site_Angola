import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthDivider } from '../components/auth/AuthDivider'
import { AuthFormField } from '../components/auth/AuthFormField'
import { AuthGuestLink } from '../components/auth/AuthGuestLink'
import { AuthLayout } from '../components/auth/AuthLayout'
import { AuthNavLinks } from '../components/auth/AuthNavLinks'
import { GoogleAuthButton } from '../components/GoogleAuthButton'
import { buildAuthPath, useAuthRedirect } from '../hooks/useAuthRedirect'
import { useMarketplace } from '../context/MarketplaceContext'

export default function LoginPage() {
  const { isLoggedIn, loginWithEmail, loginWithGoogle } = useMarketplace()
  const { redirectParam } = useAuthRedirect()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Entrar | Kuteka'
  }, [])

  function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const result = loginWithEmail({ email, password })
    if (!result.ok) setError(result.error)
  }

  function handleGoogleCredential(credential) {
    loginWithGoogle(credential)
  }

  if (isLoggedIn) return null

  const forgotPath = buildAuthPath('/recuperar-senha', redirectParam)
  const signupPath = buildAuthPath('/cadastro', redirectParam)

  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Entre para gerir anúncios, favoritos e contactos."
      redirectPath={redirectParam}
    >
      <form className="auth-facebook-form" onSubmit={handleSubmit}>
        <AuthFormField
          id="login-email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nome@email.com"
          autoComplete="email"
        />
        <AuthFormField
          id="login-password"
          label="Senha"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="A sua senha"
          autoComplete="current-password"
          minLength={6}
        />

        <div className="auth-form-row">
          <Link className="auth-forgot-link" to={forgotPath}>
            Esqueceu a senha?
          </Link>
        </div>

        {error ? <p className="auth-facebook-error">{error}</p> : null}

        <button className="button primary auth-facebook-submit auth-facebook-submit-blue" type="submit">
          Entrar
        </button>
      </form>

      <AuthDivider />

      <GoogleAuthButton onCredential={handleGoogleCredential} label="Continuar com Google" />

      <AuthNavLinks primary={{ to: signupPath, label: 'Não tem conta? Cadastrar-se' }} />

      <AuthGuestLink />
    </AuthLayout>
  )
}
