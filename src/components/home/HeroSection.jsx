import { Link } from 'react-router-dom'

export function HeroSection() {
  return (
    <section className="hp-hero">
      <div className="hp-hero-overlay" />
      <div className="hp-container hp-hero-inner">
        <p className="hp-eyebrow">Kuteka • Marketplace Angola</p>
        <h1>Encontre o imóvel ou veículo ideal em Angola.</h1>
        <p className="hp-hero-sub">
          Milhares de anúncios verificados de casas, apartamentos, terrenos, quartos e veículos num
          único lugar.
        </p>
        <div className="hp-hero-actions">
          <a className="hp-btn hp-btn-primary" href="#pesquisa">
            Pesquisar anúncios
          </a>
          <Link className="hp-btn hp-btn-secondary" to="/publicar">
            Publicar anúncio
          </Link>
        </div>
      </div>
    </section>
  )
}
