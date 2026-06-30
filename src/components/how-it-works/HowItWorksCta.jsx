import { Link } from 'react-router-dom'

export function HowItWorksCta() {
  return (
    <section className="hiw-cta panel-card">
      <h2>Pronto para começar?</h2>
      <p>Pesquisa gratuita, contacto directo e anúncios em todo o país.</p>
      <div className="hiw-cta-actions">
        <Link className="button primary" to="/explorar">
          Explorar marketplace
        </Link>
        <Link className="button secondary" to="/publicar">
          Publicar anúncio
        </Link>
        <Link className="text-button" to="/entrar">
          Entrar na conta
        </Link>
      </div>
    </section>
  )
}
