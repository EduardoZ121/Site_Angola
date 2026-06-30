import { Link } from 'react-router-dom'
import { AGENT_EMAIL } from '../../data/constants'

export function AgentAccessDenied({ profileEmail }) {
  return (
    <div className="agent-access-denied panel-card">
      <strong>Sem permissão</strong>
      <p>
        O painel de agente está disponível para agentes aprovados pela Kuteka.
        {profileEmail ? ` Entrou como ${profileEmail}.` : ''}
      </p>
      <p className="agent-access-hint">
        Conta seed de demonstração: <strong>{AGENT_EMAIL}</strong>
      </p>
      <div className="agent-access-actions">
        <Link className="button primary" to="/seja-agente">
          Candidatar-me a agente
        </Link>
        <Link className="button filter-button" to="/inicio">
          Voltar ao início
        </Link>
        <Link className="button filter-button" to="/entrar?redirect=%2Fagente">
          Entrar com outra conta
        </Link>
      </div>
    </div>
  )
}
