import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthDivider } from '../components/auth/AuthDivider'
import { AuthFormField } from '../components/auth/AuthFormField'
import { AuthLayout } from '../components/auth/AuthLayout'
import { AuthNavLinks } from '../components/auth/AuthNavLinks'
import { GoogleAuthButton } from '../components/GoogleAuthButton'
import { buildAuthPath, useAuthRedirect } from '../hooks/useAuthRedirect'
import { useMarketplace } from '../context/MarketplaceContext'
import { validateRegistration } from '../services/authService'

export default function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isLoggedIn, registerWithEmail, loginWithGoogle } = useMarketplace()
  useAuthRedirect()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (searchParams.get('mode') === 'entrar') {
      const redirect = searchParams.get('redirect')
      navigate(buildAuthPath('/entrar', redirect), { replace: true })
    }
  }, [navigate, searchParams])

  function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const validation = validateRegistration({ name, email, password, confirmPassword })
    if (!validation.ok) {
      setError(validation.error)
      return
    }

    const result = registerWithEmail({ name, email, password })
    if (!result.ok) setError(result.error)
  }

  function handleGoogleCredential(credential) {
    loginWithGoogle(credential)
  }

  if (isLoggedIn) return null

  const loginPath = buildAuthPath('/entrar')

  return (
    <AuthLayout
      title="Crie gratuitamente a sua conta Kuteka"
      subtitle="Sem custos. Leva menos de 1 minuto. Depois escolhe o perfil quando quiser publicar ou procurar."
      footnote="Ao cadastrar, concorda com as regras do marketplace Kuteka para anúncios em Angola."
    >
      <form className="auth-facebook-form" onSubmit={handleSubmit}>
        <AuthFormField
          id="signup-name"
          label="Nome e apelido"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome completo"
          autoComplete="name"
        />
        <AuthFormField
          id="signup-email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nome@email.com"
          autoComplete="email"
        />
        <AuthFormField
          id="signup-password"
          label="Senha"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          minLength={6}
        />
        <AuthFormField
          id="signup-confirm"
          label="Confirmar senha"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repita a senha"
          autoComplete="new-password"
          minLength={6}
        />

        {error ? <p className="auth-facebook-error">{error}</p> : null}

        <button className="auth-facebook-submit" type="submit">
          Cadastrar
        </button>
      </form>

      <AuthDivider />

      <GoogleAuthButton onCredential={handleGoogleCredential} label="Continuar com Google" />

      <AuthNavLinks primary={{ to: loginPath, label: 'Já tem conta? Entrar' }} />
    </AuthLayout>
  )
}
