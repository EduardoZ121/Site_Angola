import { Link } from 'react-router-dom'
import { homeCategories } from '../../data/homeContent'

export function CategoriesSection({ hideHead = false }) {
  return (
    <section className="hp-section">
      <div className="hp-container">
        {hideHead ? null : (
          <div className="hp-section-head">
            <p className="hp-eyebrow dark">Explorar</p>
            <h2>O que procura?</h2>
            <p className="hp-section-lead">
              Compre, arrende ou encontre veículos — cada secção com filtros avançados.
            </p>
          </div>
        )}
        <div className="hp-categories-grid">
          {homeCategories.map((item) => (
            <article className="hp-category-card" key={item.to}>
              <img src={item.image} alt="" loading="lazy" />
              <div className="hp-category-body">
                <span className="hp-category-count">{item.countLabel}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <Link className="hp-link-btn hp-link-arrow" to={item.to}>
                  Explorar
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
