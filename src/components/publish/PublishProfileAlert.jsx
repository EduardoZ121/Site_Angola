import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'

export function PublishProfileAlert({ profile }) {
  if (profile.name && profile.phone) return null

  const needsPhone = !profile.phone
  const message = needsPhone
    ? 'Para publicar um anúncio precisamos apenas do seu telefone.'
    : 'Falta o seu nome para identificar o anúncio junto dos compradores.'

  return (
    <div className="publish-alert-card" role="alert">
      <span className="publish-alert-icon" aria-hidden="true">
        <HomeIcon name="shield" />
      </span>
      <div className="publish-alert-body">
        <strong>Complete o seu perfil</strong>
        <p>{message}</p>
        <Link className="button primary publish-alert-btn" to="/conta">
          Completar perfil
        </Link>
      </div>
    </div>
  )
}
