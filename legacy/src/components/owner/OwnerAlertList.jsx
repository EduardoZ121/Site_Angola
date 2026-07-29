import { useNavigate } from 'react-router-dom'
import { getNotificationTarget } from '../../utils/ownerDashboard'

export function OwnerAlertList({ alerts = [], onMarkRead }) {
  const navigate = useNavigate()

  if (!alerts.length) return null

  function handleClick(item) {
    onMarkRead?.(item.id)
    navigate(getNotificationTarget(item))
  }

  return (
    <ul className="owner-alerts-list">
      {alerts.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            className={`owner-alert-item panel-card${item.read ? ' read' : ''}`}
            onClick={() => handleClick(item)}
          >
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </button>
        </li>
      ))}
    </ul>
  )
}
