import { Link } from 'react-router-dom'

export function CallToActionSection({ searchTo = '/inicio', searchLabel = 'Começar pesquisa' }) {
  return (
    <section className="hp-section hp-cta">
      <div className="hp-container hp-cta-inner">
        <h2>Pronto para encontrar o seu próximo imóvel ou veículo?</h2>
        <p>Comece agora — pesquisa gratuita, contacto directo e anúncios em todo o país.</p>
        <div className="hp-cta-actions">
          <Link className="hp-btn hp-btn-primary" to={searchTo}>
            {searchLabel}
          </Link>
          <Link className="hp-btn hp-btn-secondary-dark" to="/publicar">
            Publicar anúncio
          </Link>
        </div>
      </div>
    </section>
  )
}
