import { Navigate, useParams } from 'react-router-dom'
import { PublishWizard } from '../components/publish/PublishWizard'
import { useMarketplace } from '../context/MarketplaceContext'

export default function EditListingPage() {
  const { id } = useParams()
  const { getListing, isListingOwner } = useMarketplace()
  const listing = getListing(id)

  if (!listing || !isListingOwner(listing)) {
    return <Navigate to="/painel" replace />
  }

  if (listing.status === 'Pendente') {
    return <Navigate to={`/publicar/enviado/${listing.id}`} replace />
  }

  return (
    <main className="page-main">
      <PublishWizard editListingId={id} />
    </main>
  )
}
