import { useEffect, useState } from 'react'
import { PUBLISH_CATEGORIES } from '../../constants/publishCategories'
import { HomeIcon } from '../icons/HomeIcon'

export function CategoryStep({ draft, onSelect }) {
  const [justSelected, setJustSelected] = useState(null)
  const selected = PUBLISH_CATEGORIES.find((item) => item.id === draft.listingCategory)

  useEffect(() => {
    if (!draft.listingCategory) return undefined
    setJustSelected(draft.listingCategory)
    const timer = window.setTimeout(() => setJustSelected(null), 3200)
    return () => window.clearTimeout(timer)
  }, [draft.listingCategory])

  return (
    <section className="publish-step panel-card publish-step-animate">
      <header className="publish-step-header">
        <h2>Escolha a categoria</h2>
        <p>Seleccione o tipo de anúncio — os passos seguintes adaptam-se automaticamente.</p>
      </header>

      {justSelected && selected ? (
        <div className="publish-category-confirm" role="status">
          <HomeIcon name="check" />
          <div>
            <strong>Categoria seleccionada</strong>
            <span>
              ✔ {selected.label} — os próximos campos foram adaptados automaticamente.
            </span>
          </div>
        </div>
      ) : null}

      <div className="publish-category-grid">
        {PUBLISH_CATEGORIES.map((item) => {
          const isSelected = draft.listingCategory === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`publish-category-card${isSelected ? ' selected' : ''}`}
              onClick={() => onSelect(item.id)}
            >
              {isSelected ? <span className="publish-category-check" aria-hidden="true">✓</span> : null}
              <span className="publish-category-thumb">
                <img src={item.image} alt="" loading="lazy" />
                <span className="publish-category-icon">
                  <HomeIcon name={item.icon} />
                </span>
              </span>
              <strong>{item.label}</strong>
              <span className="publish-category-desc">{item.description}</span>
              <span className="publish-category-sub">{item.subtitle}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
