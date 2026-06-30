import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'
import { AGENT_CROSS_LINKS } from '../../utils/agent'

export function AgentCrossNav() {
  return (
    <nav className="agent-cross-nav panel-card" aria-label="Atalhos do agente">
      <span className="agent-cross-label">Ir para:</span>
      <div className="agent-cross-links">
        {AGENT_CROSS_LINKS.map((item) => (
          <Link key={item.to} className="agent-cross-link" to={item.to}>
            <HomeIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
