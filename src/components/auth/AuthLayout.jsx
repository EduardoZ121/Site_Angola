import { Link } from 'react-router-dom'

export function AuthLayout({ title, subtitle, children, footnote }) {
  return (
    <div className="auth-facebook">
      <div className="auth-facebook-shell">
        <aside className="auth-facebook-intro">
          <Link to="/entrar" aria-label="Kuteka — entrar">
            <img className="auth-facebook-logo" src="/kuteka-logo.svg" alt="Kuteka" />
          </Link>
          <h1>Kuteka liga compradores e proprietários em Angola.</h1>
          <p>
            Encontre casa, carro ou publique o seu imóvel — tudo em Kwanza, com confiança.
          </p>
        </aside>

        <div className="auth-facebook-card-wrap">
          <div className="auth-facebook-card">
            <h2>{title}</h2>
            {subtitle ? <p className="auth-facebook-sub">{subtitle}</p> : null}
            {children}
          </div>
          {footnote ? <p className="auth-facebook-foot">{footnote}</p> : null}
        </div>
      </div>
    </div>
  )
}
