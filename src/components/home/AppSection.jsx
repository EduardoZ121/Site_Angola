import { HomeIcon } from '../icons/HomeIcon'

export function AppSection() {
  return (
    <section className="hp-section">
      <div className="hp-container hp-app-banner">
        <div className="hp-app-copy">
          <p className="hp-eyebrow dark">Em breve</p>
          <h2>Kuteka no seu telemóvel</h2>
          <p className="hp-section-lead">
            Aplicação Android e iPhone para pesquisar, publicar e receber alertas em tempo real.
          </p>
          <div className="hp-app-buttons">
            <button className="hp-btn hp-btn-muted" type="button" disabled>
              Android — Em breve
            </button>
            <button className="hp-btn hp-btn-muted" type="button" disabled>
              iPhone — Em breve
            </button>
          </div>
        </div>
        <div className="hp-app-visual" aria-hidden="true">
          <HomeIcon name="mobile" />
        </div>
      </div>
    </section>
  )
}
