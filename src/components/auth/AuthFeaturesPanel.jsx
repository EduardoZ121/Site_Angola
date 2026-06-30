import { HomeIcon } from '../icons/HomeIcon'
import { AUTH_FEATURES } from '../../utils/auth'

export function AuthFeaturesPanel() {
  return (
    <ul className="auth-features" aria-label="Benefícios da conta Kuteka">
      {AUTH_FEATURES.map((item) => (
        <li key={item.title} className="auth-feature">
          <span className="auth-feature-icon" aria-hidden="true">
            <HomeIcon name={item.icon} />
          </span>
          <div>
            <strong>{item.title}</strong>
            <p>{item.text}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
