import { useEffect } from 'react'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { HelpTip } from '../components/ui/HelpTip'
import { PublishWizard } from '../components/publish/PublishWizard'

export default function PublishPage() {
  useEffect(() => {
    document.title = 'Publicar anúncio | Kuteka'
  }, [])

  return (
    <main className="page-main publish-page">
      <div className="publish-page-inner section-block-inner">
        <CatalogBreadcrumbs
          items={[
            { label: 'Início', to: '/inicio' },
            { label: 'Painel', to: '/painel' },
            { label: 'Publicar', to: '/publicar' },
          ]}
        />

        <p className="publish-help-line">
          Preencha os passos — o rascunho guarda-se automaticamente no telemóvel.
          <HelpTip
            label="Ajuda: publicar"
            text="Após enviar, um administrador revê fotos e dados antes do anúncio ficar visível no catálogo."
          />
        </p>

        <PublishWizard />
      </div>
    </main>
  )
}
