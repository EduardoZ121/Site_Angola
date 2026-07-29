import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'

export function AboutAppBanner() {
  return (
    <section className="about-app-banner panel-card">
      <div className="about-app-copy">
        <p className="about-eyebrow">Em breve</p>
        <h2>Kuteka no seu telemóvel</h2>
        <p>Aplicação Android e iPhone para pesquisar, publicar e receber alertas em tempo real.</p>
        <div className="about-app-buttons">
          <button className="button ghost" type="button" disabled>
            Android — Em breve
          </button>
          <button className="button ghost" type="button" disabled>
            iPhone — Em breve
          </button>
        </div>
      </div>
      <span className="about-app-icon" aria-hidden="true">
        <HomeIcon name="mobile" />
      </span>
    </section>
  )
}

export function AboutCta() {
  return (
    <section className="about-cta panel-card">
      <h2>Faça parte do marketplace</h2>
      <p>Pesquise imóveis e veículos ou publique o seu anúncio hoje.</p>
      <div className="about-cta-actions">
        <Link className="button primary" to="/explorar">
          Explorar anúncios
        </Link>
        <Link className="button secondary" to="/publicar">
          Publicar
        </Link>
      </div>
    </section>
  )
}
