import { Link } from 'react-router-dom'
import { ADMIN_EMAIL } from '../../data/constants'

export function AdminAccessDenied({ profileEmail }) {
  return (
    <div className="admin-access-denied panel-card">
      <strong>Sem permissão</strong>
      <p>
        O painel admin está disponível apenas para <strong>{ADMIN_EMAIL}</strong>.
        {profileEmail ? ` Entrou como ${profileEmail}.` : ''}
      </p>
      <div className="admin-access-actions">
        <Link className="button primary" to="/inicio">
          Voltar ao início
        </Link>
        <Link className="button filter-button" to="/entrar?redirect=%2Fadmin">
          Entrar com outra conta
        </Link>
      </div>
    </div>
  )
}
