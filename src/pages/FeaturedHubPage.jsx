import { Link } from 'react-router-dom'
import { CallToActionSection } from '../components/home/CallToActionSection'
import { FeaturedSection } from '../components/home/FeaturedSection'
import { HomeSubPageLayout } from '../components/home/HomeSubPageLayout'
import '../styles/home.css'

export default function FeaturedHubPage() {
  return (
    <HomeSubPageLayout
      eyebrow="Destaques"
      title="Anúncios em destaque"
      lead="Seleccionados pela equipa Kuteka — verificados e actualizados."
    >
      <FeaturedSection hideHead />
      <section className="hp-section hp-section-muted">
        <div className="hp-container hp-hub-more">
          <p className="hp-section-lead">Quer ver mais resultados?</p>
          <div className="hp-hub-more-links">
            <Link className="hp-btn hp-btn-primary" to="/comprar">
              Comprar imóveis
            </Link>
            <Link className="hp-btn hp-btn-secondary" to="/arrendar">
              Arrendar
            </Link>
            <Link className="hp-btn hp-btn-secondary" to="/veiculos">
              Veículos
            </Link>
          </div>
        </div>
      </section>
      <CallToActionSection searchTo="/inicio" />
    </HomeSubPageLayout>
  )
}
