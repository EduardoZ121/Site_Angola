import { HeroSection } from '../components/home/HeroSection'
import { HomeFooter } from '../components/home/HomeFooter'
import { HomeHubSection } from '../components/home/HomeHubSection'
import { SearchSection } from '../components/home/SearchSection'
import '../styles/home.css'

export default function HomePage() {
  return (
    <main className="hp-page">
      <div className="hp-hero-shell">
        <HeroSection />
        <SearchSection embedded />
      </div>
      <HomeHubSection />
      <HomeFooter />
    </main>
  )
}
