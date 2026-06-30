import { HeroSection } from '../components/home/HeroSection'
import { SearchSection } from '../components/home/SearchSection'
import { FeaturedSection } from '../components/home/FeaturedSection'
import { CategoriesSection } from '../components/home/CategoriesSection'
import { BenefitsSection } from '../components/home/BenefitsSection'
import { HomeHowTeaser } from '../components/home/HomeHowTeaser'
import { HomeHubSection } from '../components/home/HomeHubSection'
import { CallToActionSection } from '../components/home/CallToActionSection'
import { HomeFooter } from '../components/home/HomeFooter'
import '../styles/home.css'

export default function HomePage() {
  return (
    <main className="hp-page">
      <div className="hp-hero-shell">
        <HeroSection />
        <SearchSection embedded />
      </div>
      <FeaturedSection />
      <CategoriesSection />
      <BenefitsSection />
      <HomeHowTeaser />
      <HomeHubSection />
      <CallToActionSection searchTo="/inicio#pesquisa" searchLabel="Pesquisar agora" />
      <HomeFooter />
    </main>
  )
}
