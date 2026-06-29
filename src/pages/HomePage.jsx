import { AppSection } from '../components/home/AppSection'
import { BenefitsSection } from '../components/home/BenefitsSection'
import { CallToActionSection } from '../components/home/CallToActionSection'
import { CategoriesSection } from '../components/home/CategoriesSection'
import { FeaturedSection } from '../components/home/FeaturedSection'
import { HeroSection } from '../components/home/HeroSection'
import { HomeFooter } from '../components/home/HomeFooter'
import { HowItWorksSection } from '../components/home/HowItWorksSection'
import { QuickSearchSection } from '../components/home/QuickSearchSection'
import { SearchSection } from '../components/home/SearchSection'
import { StatsSection } from '../components/home/StatsSection'
import { TestimonialsSection } from '../components/home/TestimonialsSection'
import '../styles/home.css'

export default function HomePage() {
  return (
    <main className="hp-page">
      <div className="hp-hero-shell">
        <HeroSection />
        <SearchSection embedded />
      </div>
      <QuickSearchSection />
      <CategoriesSection />
      <FeaturedSection />
      <BenefitsSection />
      <HowItWorksSection />
      <StatsSection />
      <TestimonialsSection />
      <CallToActionSection />
      <AppSection />
      <HomeFooter />
    </main>
  )
}
