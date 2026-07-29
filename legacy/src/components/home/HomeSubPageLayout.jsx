import { Link } from 'react-router-dom'
import { HomeFooter } from './HomeFooter'

export function HomeSubPageLayout({ eyebrow, title, lead, children, backLabel = 'Início', backTo = '/inicio' }) {
  return (
    <main className="hp-page hp-subpage">
      <div className="hp-subpage-top">
        <div className="hp-container">
          <Link className="hp-subpage-back" to={backTo}>
            ← {backLabel}
          </Link>
          <header className="hp-subpage-head">
            {eyebrow ? <p className="hp-eyebrow dark">{eyebrow}</p> : null}
            <h1>{title}</h1>
            {lead ? <p className="hp-section-lead">{lead}</p> : null}
          </header>
        </div>
      </div>
      {children}
      <HomeFooter />
    </main>
  )
}
