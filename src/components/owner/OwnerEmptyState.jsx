import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'

export function OwnerEmptyState({ filtered = false, onClearFilter }) {
  if (filtered) {
    return (
      <div className="owner-empty panel-card">
        <p>Nenhum anúncio neste filtro.</p>
        <button type="button" className="button filter-button" onClick={onClearFilter}>
          Ver todos
        </button>
      </div>
    )
  }

  return (
    <div className="owner-empty panel-card">
      <span className="owner-empty-icon" aria-hidden="true">
        <HomeIcon name="home" />
      </span>
      <h3>Ainda não publicou nenhum anúncio</h3>
      <p>Leva menos de cinco minutos. Publique gratuitamente e receba contactos.</p>
      <Link className="button primary" to="/publicar">
        Publicar primeiro anúncio
      </Link>
      <div className="owner-empty-links">
        <Link to="/conta">Completar perfil</Link>
        <Link to="/como-funciona">Como funciona</Link>
      </div>
    </div>
  )
}
