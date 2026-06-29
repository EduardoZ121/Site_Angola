import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthFormField } from '../components/auth/AuthFormField'
import { AuthLayout } from '../components/auth/AuthLayout'
import { AuthNavLinks } from '../components/auth/AuthNavLinks'
import { useAuthRedirect } from '../hooks/useAuthRedirect'
import { useMarketplace } from '../context/MarketplaceContext'

export default function ForgotPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { isLoggedIn, requestPasswordReset, resetPasswordWithToken } = useMarketplace()
  useAuthRedirect()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [demoLink, setDemoLink] = useState('')

  function handleRequest(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setDemoLink('')

    const result = requestPasswordReset(email)
    if (!result.ok) {
      setError(result.error)
      return
    }

    setSuccess('Pedido recebido. Em produção enviaríamos um email com o link de recuperação.')
    setDemoLink(`/recuperar-senha?token=${result.token}`)
  }

  function handleReset(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const result = resetPasswordWithToken({ token, password, confirmPassword })
    if (!result.ok) {
      setError(result.error)
      return
    }

    setSuccess('Senha actualizada. A redireccionar...')
  }

  if (isLoggedIn) return null

  if (token) {
    return (
      <AuthLayout
        title="Definir nova senha"
        subtitle="Escolha uma senha segura com pelo menos 6 caracteres."
      >
        <form className="auth-facebook-form" onSubmit={handleReset}>
          <AuthFormField
            id="reset-password"
            label="Nova senha"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Nova senha"
            autoComplete="new-password"
            minLength={6}
          />
          <AuthFormField
            id="reset-confirm"
            label="Confirmar nova senha"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repita a nova senha"
            autoComplete="new-password"
            minLength={6}
          />

          {error ? <p className="auth-facebook-error">{error}</p> : null}
          {success ? <p className="auth-facebook-success">{success}</p> : null}

          <button className="auth-facebook-submit auth-facebook-submit-blue" type="submit">
            Guardar nova senha
          </button>
        </form>

        <AuthNavLinks primary={{ to: '/entrar', label: 'Voltar ao login' }} />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Indique o email da sua conta. Enviaremos instruções para redefinir a senha."
    >
      <form className="auth-facebook-form" onSubmit={handleRequest}>
        <AuthFormField
          id="reset-email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nome@email.com"
          autoComplete="email"
        />

        {error ? <p className="auth-facebook-error">{error}</p> : null}
        {success ? (
          <div className="auth-facebook-success-block">
            <p className="auth-facebook-success">{success}</p>
            {demoLink ? (
              <p className="auth-demo-link">
                Demo local (sem email):{' '}
                <Link to={demoLink}>Abrir link de recuperação</Link>
              </p>
            ) : null}
          </div>
        ) : null}

        <button className="auth-facebook-submit auth-facebook-submit-blue" type="submit">
          Enviar pedido
        </button>
      </form>

      <AuthNavLinks
        primary={{ to: '/entrar', label: 'Voltar ao login' }}
        secondary={{ to: '/cadastro', label: 'Criar conta' }}
      />
    </AuthLayout>
  )
}
