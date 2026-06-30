import { HomeIcon } from '../icons/HomeIcon'
import { AGENT_SECTION_LINKS } from '../../utils/agent'

export function AgentQuickNav({ showAlerts = false }) {
  const links = showAlerts
    ? AGENT_SECTION_LINKS
    : AGENT_SECTION_LINKS.filter((item) => item.id !== 'alertas')

  return (
    <nav className="agent-quick-nav panel-card" aria-label="Secções do agente">
      <div className="agent-quick-links">
        {links.map((item) => (
          <a key={item.id} className="agent-quick-link" href={`#${item.id}`}>
            <HomeIcon name={item.icon} />
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
