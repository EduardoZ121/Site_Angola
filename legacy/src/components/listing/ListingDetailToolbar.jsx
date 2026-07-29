import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'

export function ListingDetailToolbar({
  listing,
  isFavorite,
  isCompared,
  compareFull,
  onFavorite,
  onCompare,
  onContact,
}) {
  const [shareNote, setShareNote] = useState('')

  async function handleShare() {
    const url = window.location.href.split('#')[0]
    setShareNote('')
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setShareNote('Link copiado')
      window.setTimeout(() => setShareNote(''), 2500)
    } catch {
      setShareNote('Não foi possível partilhar')
      window.setTimeout(() => setShareNote(''), 2500)
    }
  }

  return (
    <div className="listing-detail-toolbar panel-card">
      <div className="listing-detail-toolbar-actions">
        <button
          type="button"
          className={`listing-detail-tool-btn${isFavorite ? ' active' : ''}`}
          onClick={onFavorite}
        >
          <HomeIcon name="heart" />
          <span>{isFavorite ? 'Guardado' : 'Guardar'}</span>
        </button>
        <button
          type="button"
          className={`listing-detail-tool-btn${isCompared ? ' active' : ''}`}
          onClick={onCompare}
          title={compareFull && !isCompared ? 'Máximo de 3 anúncios na comparação' : undefined}
          disabled={compareFull && !isCompared}
        >
          <HomeIcon name="columns" />
          <span>{isCompared ? 'Na comparação' : 'Comparar'}</span>
        </button>
        <button type="button" className="listing-detail-tool-btn" onClick={handleShare}>
          <HomeIcon name="share" />
          <span>Partilhar</span>
        </button>
        {isCompared ? (
          <Link className="listing-detail-tool-btn listing-detail-tool-link" to="/comparar">
            <HomeIcon name="columns" />
            <span>Ver comparação</span>
          </Link>
        ) : null}
      </div>
      {shareNote ? <p className="listing-detail-share-note">{shareNote}</p> : null}
      <button type="button" className="button primary listing-detail-contact-cta" onClick={onContact}>
        Contactar anunciante
      </button>
    </div>
  )
}
