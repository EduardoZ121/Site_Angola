import { useEffect, useMemo } from 'react'
import { useMarketplace } from '../context/MarketplaceContext'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { AboutAppBanner, AboutCta } from '../components/about/AboutAppBanner'
import { AboutBenefits } from '../components/about/AboutBenefits'
import { AboutCrossNav } from '../components/about/AboutCrossNav'
import { AboutLegalNav, AboutLegalSections } from '../components/about/AboutLegal'
import { AboutLiveStats } from '../components/about/AboutLiveStats'
import { AboutMission } from '../components/about/AboutMission'
import { AboutTestimonials } from '../components/about/AboutTestimonials'
import { HelpTip } from '../components/ui/HelpTip'
import { PageIntro } from '../components/SectionBlock'
import { ABOUT_LEGAL_SECTIONS, ABOUT_MISSION, buildAboutLiveStats } from '../utils/about'
import '../styles/about.css'

export default function AboutPage() {
  const { listings } = useMarketplace()

  useEffect(() => {
    document.title = 'Sobre | Kuteka'
  }, [])

  const liveStats = useMemo(() => buildAboutLiveStats(listings), [listings])

  return (
    <main className="page-main about-page">
      <PageIntro
        eyebrow="Kuteka"
        title="Sobre a Kuteka"
        subtitle="Marketplace de imóveis e veículos pensado para Angola — claro, seguro e em Kz."
      />

      <div className="about-page-body section-block-inner">
        <CatalogBreadcrumbs
          items={[
            { label: 'Início', to: '/inicio' },
            { label: 'Sobre', to: '/sobre' },
          ]}
        />

        <p className="about-help-line">
          Plataforma de ligação entre quem procura e quem publica — sem intermediar pagamentos.
          <HelpTip
            label="Ajuda: Kuteka"
            text="Contratos e visitas são acordados directamente entre as partes. A Kuteka fornece pesquisa, contacto e ferramentas de gestão."
          />
        </p>

        <AboutCrossNav />
        <AboutMission items={ABOUT_MISSION} />
        <AboutLiveStats stats={liveStats} />
        <AboutBenefits />
        <AboutTestimonials />
        <AboutAppBanner />
        <AboutLegalNav sections={ABOUT_LEGAL_SECTIONS} />
        <AboutLegalSections sections={ABOUT_LEGAL_SECTIONS} />
        <AboutCta />
      </div>
    </main>
  )
}
