import { Link } from 'react-router-dom'
import { formatStaffDate, getAgentAlertLink } from '../../utils/agent'

export function AgentAlertsFeed({ alerts = [] }) {
  if (!alerts.length) return null

  return (
    <div className="notifications-list agent-alerts-feed">
      {alerts.map((item) => {
        const link = getAgentAlertLink(item)
        const isHash = link?.startsWith('#')

        return (
          <article className={`notification-card panel-card ${item.read ? 'read' : 'unread'}`} key={item.id}>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
            <small>{formatStaffDate(item.createdAt)}</small>
            {link ? (
              <div className="notification-actions">
                {isHash ? (
                  <a className="text-button" href={link}>
                    Ver secção
                  </a>
                ) : (
                  <Link className="text-button" to={link}>
                    Abrir
                  </Link>
                )}
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
