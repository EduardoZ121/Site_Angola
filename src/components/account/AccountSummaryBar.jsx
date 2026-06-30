import { Link } from 'react-router-dom'
import { HelpTip } from '../ui/HelpTip'

export function AccountSummaryBar({ summary }) {
  if (!summary) return null

  const { unread, listings, activeListings, completeness } = summary

  return (
    <div className="account-summary-bar panel-card">
      <p>
        Perfil <strong>{completeness.percent}%</strong> completo
        {unread ? (
          <>
            {' '}
            — <strong>{unread}</strong> {unread === 1 ? 'mensagem nova' : 'mensagens novas'}
          </>
        ) : (
          <> — mensagens em dia</>
        )}
        {listings ? (
          <>
            {' '}
            — <strong>{activeListings}</strong> de {listings} anúncios activos
          </>
        ) : null}
        <HelpTip
          label="Ajuda: perfil"
          text="Nome e telefone angolano são obrigatórios para publicar. Verificações aumentam o selo de confiança."
        />
      </p>
      {completeness.percent < 100 ? (
        <Link className="text-button" to="#dados">
          Completar dados
        </Link>
      ) : (
        <Link className="text-button" to="/painel">
          Ir ao painel
        </Link>
      )}
    </div>
  )
}
