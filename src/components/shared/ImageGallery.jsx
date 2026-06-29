import { useState } from 'react'
import { defaultPhoto } from '../../data/constants'

export function ImageGallery({ photos = [], title }) {
  const items = photos.length ? photos : [defaultPhoto]
  const [active, setActive] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  function showPrev() {
    setActive((index) => (index === 0 ? items.length - 1 : index - 1))
  }

  function showNext() {
    setActive((index) => (index === items.length - 1 ? 0 : index + 1))
  }

  return (
    <div className="listing-gallery">
      <div className="listing-gallery-main">
        <img src={items[active]} alt={title} loading="lazy" />
        {items.length > 1 ? (
          <>
            <button type="button" className="gallery-nav prev" onClick={showPrev} aria-label="Imagem anterior">
              ‹
            </button>
            <button type="button" className="gallery-nav next" onClick={showNext} aria-label="Imagem seguinte">
              ›
            </button>
          </>
        ) : null}
        <button
          type="button"
          className="gallery-fullscreen"
          onClick={() => setFullscreen(true)}
          aria-label="Ver em ecrã completo"
        >
          ⛶
        </button>
      </div>
      {items.length > 1 ? (
        <div className="listing-gallery-thumbs" role="tablist" aria-label="Miniaturas">
          {items.map((photo, index) => (
            <button
              key={photo + index}
              type="button"
              role="tab"
              aria-selected={index === active}
              className={index === active ? 'active' : ''}
              onClick={() => setActive(index)}
            >
              <img src={photo} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
      {fullscreen ? (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Galeria em ecrã completo">
          <button type="button" className="gallery-close" onClick={() => setFullscreen(false)} aria-label="Fechar">
            ✕
          </button>
          <img src={items[active]} alt={title} />
        </div>
      ) : null}
    </div>
  )
}
