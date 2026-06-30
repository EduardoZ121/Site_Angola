import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'
import { ADD_PROPERTY_CROSS_LINKS } from '../../utils/publish'

export function AddPropertyCrossNav() {
  return (
    <nav className="publish-cross-nav panel-card" aria-label="Ligações para proprietários">
      <span className="publish-cross-label">Também pode:</span>
      <div className="publish-cross-links">
        {ADD_PROPERTY_CROSS_LINKS.map((item) => (
          <Link key={item.to} className="publish-cross-link" to={item.to}>
            <HomeIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
