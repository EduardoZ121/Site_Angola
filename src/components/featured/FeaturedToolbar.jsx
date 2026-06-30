import { Link } from 'react-router-dom'

const SORT_OPTIONS = [
  { value: 'views', label: 'Mais vistos' },
  { value: 'recent', label: 'Mais recentes' },
  { value: 'price-asc', label: 'Preço ↑' },
  { value: 'price-desc', label: 'Preço ↓' },
]

export function FeaturedToolbar({ total, sort, catalogLink, onSortChange }) {
  if (!total) return null

  return (
    <div className="featured-toolbar panel-card">
      <p className="featured-toolbar-count">
        <strong>{total}</strong> {total === 1 ? 'anúncio' : 'anúncios'}
      </p>
      <div className="featured-toolbar-actions">
        <label className="featured-sort">
          <span className="sr-only">Ordenar destaques</span>
          Ordenar
          <select value={sort} onChange={(event) => onSortChange(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {catalogLink ? (
          <Link className="text-button" to={catalogLink}>
            Ver catálogo completo
          </Link>
        ) : null}
      </div>
    </div>
  )
}
