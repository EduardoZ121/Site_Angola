import { Link } from 'react-router-dom'
import { HomeIcon } from '../icons/HomeIcon'
import { isValidAngolaPhone } from '../../utils/profile'

export function PublishProfileAlert({ profile }) {
  if (profile.name?.trim() && isValidAngolaPhone(profile.phone)) return null

  const needsPhone = !profile.phone?.trim() || !isValidAngolaPhone(profile.phone)
  const message = !profile.name?.trim()
    ? 'Indique o seu nome para identificar o anúncio junto dos compradores.'
    : !profile.phone?.trim()
      ? 'Para publicar precisamos do seu telefone angolano (+244 9XX XXX XXX).'
      : 'Telefone inválido — use um número móvel angolano com 9 dígitos.'

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
