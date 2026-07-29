import { Link } from 'react-router-dom'
import { CategoriesSection } from '../components/home/CategoriesSection'
import { ExploreCatalogSection } from '../components/home/ExploreCatalogSection'
import { ExploreProvinceSection } from '../components/home/ExploreProvinceSection'
import { HomeSubPageLayout } from '../components/home/HomeSubPageLayout'
import { QuickSearchSection } from '../components/home/QuickSearchSection'
import { CallToActionSection } from '../components/home/CallToActionSection'
import '../styles/home.css'

export default function ExplorePage() {
  return (
    <HomeSubPageLayout
      eyebrow="Explorar"
      title="O que procura?"
      lead="Catálogo completo, pesquisas rápidas e filtros por província — tudo ligado ao marketplace Kuteka."
    >
      <ExploreCatalogSection />
      <QuickSearchSection compact showHead />
      <ExploreProvinceSection />
      <CategoriesSection
        title="Explorar por tipo"
        subtitle="Cartões com atalhos directos para cada segmento do marketplace."
      />
      <section className="hp-section">
        <div className="hp-container hp-explore-more">
          <p className="hp-section-lead">Precisa de mais opções?</p>
          <div className="hp-explore-more-links">
            <Link className="hp-btn hp-btn-primary" to="/destaques">
              Anúncios em destaque
            </Link>
            <Link className="hp-btn hp-btn-secondary hp-btn-on-light" to="/precos">
              Preços por zona
            </Link>
            <Link className="hp-btn hp-btn-secondary hp-btn-on-light" to="/inicio#pesquisa">
              Pesquisa completa
            </Link>
          </div>
        </div>
      </section>
      <CallToActionSection searchTo="/comprar" searchLabel="Ver imóveis à venda" />
    </HomeSubPageLayout>
  )
}
