import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'

export function FeaturedOwnerBanner() {
  return (
    <aside className="featured-owner-banner panel-card">
      <div className="featured-owner-icon" aria-hidden="true">
        <HomeIcon name="bolt" />
      </div>
      <div className="featured-owner-text">
        <strong>Quer destacar o seu anúncio?</strong>
        <p>Mais visibilidade no topo do catálogo e nesta página — gerido no painel do proprietário.</p>
      </div>
      <div className="featured-owner-actions">
        <Link className="button primary" to="/painel">
          Ir ao painel
        </Link>
        <Link className="text-button" to="/publicar">
          Publicar anúncio
        </Link>
      </div>
    </aside>
  )
}
