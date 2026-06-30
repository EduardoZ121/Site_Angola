import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'
import { AGENT_APPLY_CROSS_LINKS } from '../../utils/agent'

export function AgentApplyCrossNav() {
  return (
    <nav className="agent-cross-nav panel-card" aria-label="Ligações úteis">
      <span className="agent-cross-label">Também pode:</span>
      <div className="agent-cross-links">
        {AGENT_APPLY_CROSS_LINKS.map((item) => (
          <Link key={item.to} className="agent-cross-link" to={item.to}>
            <HomeIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
