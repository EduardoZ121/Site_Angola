import { Link } from 'react-router-dom'
import { AuthCrossNav } from './AuthCrossNav'
import { AuthFeaturesPanel } from './AuthFeaturesPanel'
import { AuthLegalFootnote } from './AuthLegalFootnote'
import { AuthRedirectBanner } from './AuthRedirectBanner'

export function AuthLayout({ title, subtitle, children, redirectPath, showFeatures = true }) {
  return (
    <div className="auth-facebook">
      <div className="auth-facebook-shell">
        <aside className="auth-facebook-intro">
          <Link to="/inicio" aria-label="Kuteka — início">
            <img className="auth-facebook-logo" src="/kuteka-logo.svg" alt="Kuteka" />
          </Link>
          <h1>Kuteka liga compradores e proprietários em Angola.</h1>
          <p>
            Encontre casa, carro ou publique o seu imóvel — tudo em Kwanza, com confiança.
          </p>
          {showFeatures ? <AuthFeaturesPanel /> : null}
          <AuthCrossNav />
        </aside>

        <div className="auth-facebook-card-wrap">
          {redirectPath ? <AuthRedirectBanner redirectPath={redirectPath} /> : null}
          <div className="auth-facebook-card">
            <h2>{title}</h2>
            {subtitle ? <p className="auth-facebook-sub">{subtitle}</p> : null}
            {children}
          </div>
          <AuthCrossNav className="auth-cross-nav-mobile" />
          <AuthLegalFootnote />
        </div>
      </div>
    </div>
  )
}
