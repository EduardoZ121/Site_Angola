import { Link, useNavigate } from 'react-router-dom'
import { getAccountNotificationTarget } from '../../utils/account'

export function AccountNotificationsList({
  notifications = [],
  profileEmail = '',
  onMarkRead,
  onMarkAllRead,
}) {
  const navigate = useNavigate()

  if (!notifications.length) {
    return (
      <div className="empty-state panel-card">
        <p>Ainda não tem mensagens.</p>
        <Link className="text-button" to="/explorar">
          Explorar anúncios
        </Link>
      </div>
    )
  }

  function openNotification(item) {
    if (!item.read) onMarkRead?.(item.id)
    navigate(getAccountNotificationTarget(item))
  }

  return (
    <>
      {notifications.some((item) => !item.read) ? (
        <div className="account-notifications-toolbar">
          <button className="text-button" type="button" onClick={onMarkAllRead}>
            Marcar todas como lidas
          </button>
        </div>
      ) : null}

      <div className="notifications-list">
        {notifications.map((item) => (
          <article
            className={`notification-card panel-card ${item.read ? 'read' : 'unread'}`}
            key={item.id}
          >
            <button type="button" className="notification-open" onClick={() => openNotification(item)}>
              <div className="notification-head">
                <strong>{item.title}</strong>
                {!item.read ? <span className="status-pill status-pending">Nova</span> : null}
              </div>
              <p>{item.body}</p>
              {item.emailSent ? (
                <small className="email-sent-line">
                  ✉ Email enviado (demo) para {item.ownerEmail || profileEmail || 'si'}
                </small>
              ) : null}
            </button>
            <div className="notification-actions">
              {!item.read ? (
                <button className="text-button" type="button" onClick={() => onMarkRead(item.id)}>
                  Marcar como lida
                </button>
              ) : null}
              <Link className="text-button" to={getAccountNotificationTarget(item)}>
                Abrir
              </Link>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}
