import { Link } from 'react-router-dom'
import { formatStaffDate, getAdminActivityLink } from '../../utils/admin'

export function AdminActivityFeed({ notifications = [] }) {
  if (!notifications.length) {
    return (
      <div className="empty-state panel-card">
        <p>Sem actividade registada.</p>
      </div>
    )
  }

  return (
    <div className="notifications-list admin-activity-feed">
      {notifications.map((item) => {
        const link = getAdminActivityLink(item)

        return (
          <article className="notification-card panel-card read" key={item.id}>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
            <small>
              {item.ownerEmail || item.ownerName || '—'} • {formatStaffDate(item.createdAt)}
            </small>
            {link ? (
              <div className="notification-actions">
                <Link className="text-button" to={link}>
                  Abrir anúncio
                </Link>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
