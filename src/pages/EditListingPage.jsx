import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { HelpTip } from '../components/ui/HelpTip'
import { PublishWizard } from '../components/publish/PublishWizard'
import { useMarketplace } from '../context/MarketplaceContext'
import '../styles/publish.css'

export default function EditListingPage() {
  const { id } = useParams()
  const { getListing, isListingOwner } = useMarketplace()
  const listing = getListing(id)

  useEffect(() => {
    document.title = listing ? `Editar: ${listing.title} | Kuteka` : 'Editar anúncio | Kuteka'
  }, [listing])

  if (!listing || !isListingOwner(listing)) {
    return <Navigate to="/painel" replace />
  }

  if (listing.status === 'Pendente') {
    return <Navigate to={`/publicar/enviado/${listing.id}`} replace />
  }

  return (
    <main className="page-main publish-page">
      <div className="publish-page-inner section-block-inner">
        <CatalogBreadcrumbs
          items={[
            { label: 'Início', to: '/inicio' },
            { label: 'Painel', to: '/painel' },
            { label: 'Editar anúncio', to: `/painel/editar/${listing.id}` },
          ]}
        />

        <p className="publish-help-line">
          <Link to="/painel">← Voltar ao painel</Link>
          <span className="publish-edit-title">A editar: {listing.title}</span>
          <HelpTip
            label="Ajuda: editar"
            text="Alterações em anúncios activos podem voltar a revisão. Rejeitados devem ser corrigidos antes de reenviar."
          />
        </p>

        <PublishWizard editListingId={id} />
      </div>
    </main>
  )
}
