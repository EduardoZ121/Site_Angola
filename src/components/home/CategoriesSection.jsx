import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { homeCategories } from '../../data/homeContent'
import { useMarketplace } from '../../context/MarketplaceContext'
import { computeCategoryCounts, formatLiveCount } from '../../utils/homeStats'

const COUNT_KEYS = {
  '/comprar': 'buy',
  '/arrendar': 'rent',
  '/veiculos': 'vehicles',
  '/comprar?query=terreno': 'land',
  '/comprar?query=loja': 'store',
  '/comprar?query=escritório': 'office',
}

export function CategoriesSection({ hideHead = false, title, subtitle }) {
  const { listings } = useMarketplace()
  const counts = useMemo(() => computeCategoryCounts(listings), [listings])

  return (
    <section className="hp-section">
      <div className="hp-container">
        {hideHead ? null : (
          <div className="hp-section-head">
            <p className="hp-eyebrow dark">Explorar</p>
            <h2>{title || 'O que procura?'}</h2>
            <p className="hp-section-lead">
              {subtitle || 'Compre, arrende ou encontre veículos — números actualizados do catálogo Kuteka.'}
            </p>
          </div>
        )}
        <div className="hp-categories-grid">
          {homeCategories.map((item) => {
            const countKey = COUNT_KEYS[item.to] || 'buy'
            const count = counts[countKey] ?? 0
            return (
              <article className="hp-category-card" key={item.to}>
                <img src={item.image} alt="" loading="lazy" />
                <div className="hp-category-body">
                  <span className="hp-category-count">{formatLiveCount(count)}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <Link className="hp-link-btn hp-link-arrow" to={item.to}>
                    Explorar
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
