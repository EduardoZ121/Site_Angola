import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'
import { getCatalogSection } from '../../utils/catalogConfig'

export function CatalogCrossNav({ basePath }) {
  const section = getCatalogSection(basePath)
  if (!section?.crossLinks?.length) return null

  return (
    <nav className="catalog-cross-nav panel-card" aria-label="Outras secções do marketplace">
      <span className="catalog-cross-nav-label">Também pode:</span>
      <div className="catalog-cross-nav-links">
        {section.crossLinks.map((item) => (
          <Link key={item.to} className="catalog-cross-nav-link" to={item.to}>
            <HomeIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
