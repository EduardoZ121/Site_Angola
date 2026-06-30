import { CallToActionSection } from '../components/home/CallToActionSection'
import { HowItWorksSection } from '../components/home/HowItWorksSection'
import { HomeSubPageLayout } from '../components/home/HomeSubPageLayout'
import '../styles/home.css'

export default function HowItWorksPage() {
  return (
    <HomeSubPageLayout
      eyebrow="Simples"
      title="Como funciona"
      lead="Três passos para quem procura e três para quem publica."
    >
      <HowItWorksSection hideHead />
      <CallToActionSection searchTo="/explorar" searchLabel="Explorar categorias" />
    </HomeSubPageLayout>
  )
}
