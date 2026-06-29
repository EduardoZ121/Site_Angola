import { useMemo } from 'react'
import { ImageGallery } from '../shared/ImageGallery'
import { ListingDetailSections } from '../shared/ListingDetailSections'
import { ListingBadgeList } from '../shared/ListingBadge'
import { ContactCard } from '../shared/ContactCard'
import { draftToRawListing } from '../../utils/publishDraft'
import { normalizeListing } from '../../utils/listing'
import { formatKz } from '../../utils/format'

export function PreviewStep({ draft, profile }) {
  const listing = useMemo(() => {
    const raw = draftToRawListing(draft, profile)
    raw.id = 'preview'
    raw.status = 'Ativo'
    raw.listingStatus = 'ACTIVE'
    return normalizeListing(raw)
  }, [draft, profile])

  return (
    <section className="publish-step publish-preview">
      <div className="panel-card">
        <h2>Pré-visualização</h2>
        <p>Assim o anúncio aparecerá após aprovação da equipa Kuteka.</p>
      </div>
      <ListingBadgeList badges={listing.badges} />
      <h3>{listing.title}</h3>
      <p className="listing-price-line">{formatKz(listing.price)}</p>
      <div className="publish-preview-layout">
        <div>
          <ImageGallery photos={listing.media.photos} title={listing.title} />
          <ListingDetailSections listing={listing} />
        </div>
        <ContactCard listing={listing} verifiedSeal={listing.verification.profile} onMessage={() => {}} onFavorite={() => {}} />
      </div>
    </section>
  )
}
