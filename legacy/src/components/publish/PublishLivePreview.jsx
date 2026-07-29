import { defaultPhoto } from '../../data/constants'
import { getCategoryConfig } from '../../constants/publishCategories'
import { formatKz } from '../../utils/format'

export function PublishLivePreview({ draft }) {
  const category = getCategoryConfig(draft.listingCategory)
  const photo = draft.photos?.[draft.coverIndex ?? 0] || draft.photos?.[0] || defaultPhoto
  const price = draft.price ? formatKz(draft.price) : '— Kz'
  const title = draft.title || 'Título do anúncio'
  const location =
    draft.municipality && draft.province
      ? `${draft.municipality}, ${draft.province}`
      : 'Localização'

  return (
    <div className="publish-live-preview">
      <p className="publish-live-preview-label">Pré-visualização em tempo real</p>
      <p className="publish-live-preview-sub">É assim que o anúncio está a ficar.</p>

      <div className="publish-phone-frame">
        <div className="publish-phone-notch" aria-hidden="true" />
        <div className="publish-phone-screen">
          <img src={photo} alt="" className="publish-phone-photo" />
          <div className="publish-phone-body">
            <span className="publish-phone-tag">{category.label}</span>
            <strong className="publish-phone-title">{title}</strong>
            <span className="publish-phone-loc">{location}</span>
            <span className="publish-phone-price">{price}</span>
            {draft.description ? (
              <p className="publish-phone-desc">{draft.description.slice(0, 90)}…</p>
            ) : (
              <p className="publish-phone-desc muted">Descrição aparece aqui…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
