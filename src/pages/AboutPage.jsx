import { AppSection } from '../components/home/AppSection'
import { BenefitsSection } from '../components/home/BenefitsSection'
import { HomeSubPageLayout } from '../components/home/HomeSubPageLayout'
import { StatsSection } from '../components/home/StatsSection'
import { TestimonialsSection } from '../components/home/TestimonialsSection'
import '../styles/home.css'

export default function AboutPage() {
  return (
    <HomeSubPageLayout
      eyebrow="Kuteka"
      title="Sobre a Kuteka"
      lead="Marketplace de imóveis e veículos pensado para Angola — claro, seguro e em Kz."
    >
      <BenefitsSection hideHead />
      <StatsSection hideHead />
      <TestimonialsSection hideHead />
      <AppSection />
    </HomeSubPageLayout>
  )
}
