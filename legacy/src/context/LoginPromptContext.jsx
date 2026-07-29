import { createContext, useCallback, useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { buildAuthPath } from '../hooks/useAuthRedirect'

const LoginPromptContext = createContext(null)

export function LoginPromptProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    redirectPath: '',
    onSuccess: null,
  })

  const closeLoginPrompt = useCallback(() => {
    setState({ open: false, redirectPath: '', onSuccess: null })
  }, [])

  const openLoginPrompt = useCallback(({ redirectPath, onSuccess } = {}) => {
    setState({
      open: true,
      redirectPath: redirectPath || window.location.pathname + window.location.search,
      onSuccess: onSuccess || null,
    })
  }, [])

  const loginPath = buildAuthPath('/entrar', state.redirectPath || null)
  const signupPath = buildAuthPath('/cadastro', state.redirectPath || null)

  return (
    <LoginPromptContext.Provider value={{ openLoginPrompt, closeLoginPrompt }}>
      {children}
      {state.open ? (
        <div className="login-prompt-backdrop" role="presentation" onClick={closeLoginPrompt}>
          <div
            className="login-prompt-modal"
            role="dialog"
            aria-labelledby="login-prompt-title"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="login-prompt-close"
              type="button"
              aria-label="Fechar"
              onClick={closeLoginPrompt}
            >
              ×
            </button>
            <p className="eyebrow">Conta Kuteka</p>
            <h2 id="login-prompt-title">Crie uma conta gratuitamente para continuar</h2>
            <p className="login-prompt-lead">
              Entre ou cadastre-se para contactar anunciantes, guardar favoritos permanentemente e
              publicar imóveis ou veículos.
            </p>
            <div className="login-prompt-actions">
              <Link className="button primary" to={loginPath} onClick={closeLoginPrompt}>
                Entrar
              </Link>
              <Link className="button secondary" to={signupPath} onClick={closeLoginPrompt}>
                Criar conta grátis
              </Link>
            </div>
            <p className="login-prompt-note">Sem custos. Leva menos de 1 minuto.</p>
          </div>
        </div>
      ) : null}
    </LoginPromptContext.Provider>
  )
}

export function useLoginPrompt() {
  const context = useContext(LoginPromptContext)
  if (!context) {
    throw new Error('useLoginPrompt must be used within LoginPromptProvider')
  }
  return context
}
