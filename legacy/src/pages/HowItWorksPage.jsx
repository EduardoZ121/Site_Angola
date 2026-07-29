import { useEffect, useMemo, useState } from 'react'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { HowItWorksBenefits } from '../components/how-it-works/HowItWorksBenefits'
import { HowItWorksCrossNav } from '../components/how-it-works/HowItWorksCrossNav'
import { HowItWorksCta } from '../components/how-it-works/HowItWorksCta'
import { HowItWorksFaq } from '../components/how-it-works/HowItWorksFaq'
import { HowItWorksRoleTabs } from '../components/how-it-works/HowItWorksRoleTabs'
import { HowItWorksSteps } from '../components/how-it-works/HowItWorksSteps'
import { HelpTip } from '../components/ui/HelpTip'
import { PageIntro } from '../components/SectionBlock'
import { homeAgentSteps, homeOwnerSteps, homeSteps } from '../data/homeContent'
import { getStepsForRole, HOW_IT_WORKS_ROLES } from '../utils/howItWorks'
import '../styles/how-it-works.css'

export default function HowItWorksPage() {
  const [activeRole, setActiveRole] = useState('buyer')

  useEffect(() => {
    document.title = 'Como funciona | Kuteka'
  }, [])

  const roleLabel = HOW_IT_WORKS_ROLES.find((role) => role.id === activeRole)?.label || 'Comprador'
  const steps = useMemo(
    () => getStepsForRole(activeRole, { homeSteps, homeOwnerSteps, homeAgentSteps }),
    [activeRole],
  )

  return (
    <main className="page-main hiw-page">
      <PageIntro
        eyebrow="Simples"
        title="Como funciona"
        subtitle="Três passos para quem procura, três para quem publica — e um fluxo para agentes certificados."
      />

      <div className="hiw-page-body section-block-inner">
        <CatalogBreadcrumbs
          items={[
            { label: 'Início', to: '/inicio' },
            { label: 'Como funciona', to: '/como-funciona' },
          ]}
        />

        <p className="hiw-help-line">
          Escolha o seu perfil para ver o fluxo completo — cada passo tem link directo.
          <HelpTip
            label="Ajuda: fluxos"
            text="Compradores exploram e contactam; proprietários publicam no painel; agentes candidatam-se e passam por teste."
          />
        </p>

        <HowItWorksCrossNav />
        <HowItWorksRoleTabs activeRole={activeRole} onChange={setActiveRole} />
        <HowItWorksSteps steps={steps} roleLabel={roleLabel} />
        <HowItWorksBenefits />
        <HowItWorksFaq />
        <HowItWorksCta />
      </div>
    </main>
  )
}
