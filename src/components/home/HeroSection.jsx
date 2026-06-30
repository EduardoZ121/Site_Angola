import { Link } from 'react-router-dom'
import { useMarketplace } from '../../context/MarketplaceContext'
import { HomeHeroStats } from './HomeHeroStats'

export function HeroSection() {
  const { listings } = useMarketplace()

  return (
    <section className="hp-hero">
      <div className="hp-hero-overlay" />
      <div className="hp-container hp-hero-inner">
        <p className="hp-eyebrow">Kuteka • Marketplace Angola</p>
        <h1>Encontre o imóvel ou veículo ideal em Angola.</h1>
        <p className="hp-hero-sub">
          Anúncios verificados de casas, apartamentos, terrenos e veículos — pesquisa, contacto directo
          e publicação gratuita.
        </p>
        <HomeHeroStats listings={listings} />
        <div className="hp-hero-actions">
          <a className="hp-btn hp-btn-primary" href="#pesquisa">
            Pesquisar anúncios
          </a>
          <Link className="hp-btn hp-btn-secondary" to="/publicar">
            Publicar anúncio
          </Link>
          <Link className="hp-btn hp-btn-secondary" to="/destaques">
            Ver destaques
          </Link>
        </div>
      </div>
    </section>
  )
}
