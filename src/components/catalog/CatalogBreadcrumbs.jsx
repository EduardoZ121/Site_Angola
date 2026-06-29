import { Link } from 'react-router-dom'

export function CatalogBreadcrumbs({ items }) {
  return (
    <nav className="catalog-breadcrumbs" aria-label="Navegação">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        if (isLast) {
          return (
            <span key={item.label} aria-current="page">
              {item.label}
            </span>
          )
        }
        return (
          <span key={item.label}>
            <Link to={item.to}>{item.label}</Link>
            <span aria-hidden="true"> / </span>
          </span>
        )
      })}
    </nav>
  )
}
