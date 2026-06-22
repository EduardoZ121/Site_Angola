import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GoogleAuthButton } from '../components/GoogleAuthButton'
import { useMarketplace } from '../context/MarketplaceContext'

export default function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const {
    isLoggedIn,
    needsRoleSelection,
    needsBuyerFlow,
    isOnboardingComplete,
    loginWithGoogle,
    registerWithEmail,
    loginWithEmail,
  } = useMarketplace()

  const startInLoginMode = searchParams.get('mode') === 'entrar'
  const [mode, setMode] = useState(startInLoginMode ? 'entrar' : 'cadastro')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoggedIn) return
    if (needsRoleSelection) navigate('/escolher-perfil', { replace: true })
    else if (needsBuyerFlow) navigate('/procurar', { replace: true })
    else if (isOnboardingComplete) navigate('/inicio', { replace: true })
  }, [isLoggedIn, needsRoleSelection, needsBuyerFlow, isOnboardingComplete, navigate])

  function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (mode === 'cadastro') {
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.')
        return
      }
      const result = registerWithEmail({ name, email, password })
      if (!result.ok) {
        setError(result.error)
        return
      }
      return
    }

    const result = loginWithEmail({ email, password })
    if (!result.ok) setError(result.error)
  }

  function handleGoogleCredential(credential) {
    loginWithGoogle(credential)
  }

  if (isLoggedIn) return null

  return (
    <div className="auth-facebook">
      <div className="auth-facebook-shell">
        <aside className="auth-facebook-intro">
          <img className="auth-facebook-logo" src="/kuteka-logo.svg" alt="Kuteka" />
          <h1>Kuteka liga compradores e proprietários em Angola.</h1>
          <p>
            Cadastre-se para encontrar casa, carro ou publicar o seu imóvel — tudo em Kwanza, com
            confiança.
          </p>
        </aside>

        <div className="auth-facebook-card-wrap">
          <div className="auth-facebook-card">
            <h2>{mode === 'cadastro' ? 'Criar uma nova conta' : 'Entrar no Kuteka'}</h2>
            <p className="auth-facebook-sub">
              {mode === 'cadastro'
                ? 'É rápido e fácil. Depois escolhe se é comprador ou proprietário.'
                : 'Use o email e senha que cadastrou.'}
            </p>

            <form className="auth-facebook-form" onSubmit={handleSubmit}>
              {mode === 'cadastro' ? (
                <input
                  type="text"
                  placeholder="Nome e apelido"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              ) : null}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === 'cadastro' ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
              {mode === 'cadastro' ? (
                <input
                  type="password"
                  placeholder="Confirmar senha"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              ) : null}

              {error ? <p className="auth-facebook-error">{error}</p> : null}

              <button className="auth-facebook-submit" type="submit">
                {mode === 'cadastro' ? 'Cadastrar' : 'Entrar'}
              </button>
            </form>

            <div className="auth-facebook-divider">
              <span>ou</span>
            </div>

            <GoogleAuthButton
              onCredential={handleGoogleCredential}
              label="Continuar com Google"
            />

            <button
              className="auth-facebook-switch"
              type="button"
              onClick={() => {
                setError('')
                setMode(mode === 'cadastro' ? 'entrar' : 'cadastro')
              }}
            >
              {mode === 'cadastro' ? 'Já tem conta?' : 'Não tem conta?'}
              <strong>{mode === 'cadastro' ? ' Entrar' : ' Cadastrar-se'}</strong>
            </button>
          </div>

          <p className="auth-facebook-foot">
            Ao cadastrar, concorda com as regras do marketplace Kuteka para anúncios em Angola.
          </p>
        </div>
      </div>
    </div>
  )
}
