import { useEffect, useRef, useState } from 'react'
import { GOOGLE_CLIENT_ID, loadGoogleIdentityScript } from '../utils/googleAuth'

let gsiInitialized = false

export function GoogleAuthButton({ onCredential, label = 'Continuar com Google' }) {
  const buttonRef = useRef(null)
  const onCredentialRef = useRef(onCredential)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    onCredentialRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    let cancelled = false
    if (!GOOGLE_CLIENT_ID) return undefined

    loadGoogleIdentityScript()
      .then((google) => {
        if (cancelled || !buttonRef.current) return

        if (!gsiInitialized) {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => {
              if (response?.credential) {
                setError('')
                onCredentialRef.current?.(response.credential)
              } else {
                setError('Não foi possível validar a conta Google.')
              }
            },
            ux_mode: 'popup',
            auto_select: false,
            error_callback: (err) => {
              const type = String(err?.type || err || '')
              if (/popup_closed|user_cancelled/i.test(type)) return
              setError(
                'Google bloqueou o login. Confirme domínios autorizados no Google Cloud Console.',
              )
            },
          })
          gsiInitialized = true
        }

        google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'continue_with',
          width: Math.max(buttonRef.current.offsetWidth || 0, 320),
        })
        setReady(true)
      })
      .catch(() => setError('Falhou a carregar o login Google.'))

    return () => {
      cancelled = true
    }
  }, [])

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="google-auth-fallback panel-card">
        <strong>Google Login — configuração pendente</strong>
        <p>
          Defina <code>VITE_GOOGLE_CLIENT_ID</code> no Render (Environment) e no Google Cloud
          Console adicione <strong>kutekalink.com</strong> em origens autorizadas.
        </p>
      </div>
    )
  }

  return (
    <div className="google-auth-wrap">
      {!ready ? <p className="google-auth-loading">A carregar Google...</p> : null}
      {error ? <p className="warning-text">{error}</p> : null}
      <div
        ref={buttonRef}
        className={`google-auth-button-host ${ready ? '' : 'hidden'}`}
        aria-label={label}
      />
    </div>
  )
}
