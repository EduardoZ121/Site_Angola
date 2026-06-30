import { useState } from 'react'
import {
  AGENT_APPLICATION_STATUS,
  AGENT_APPLICATION_STATUS_LABELS,
  AGENT_TEST_PASS_SCORE,
  AGENT_TEST_TOTAL_QUESTIONS,
} from '../../constants/agentApplication'
import { buildTestLink, buildAgentTestMailto } from '../../utils/agentApplication'
import { AgentCandidateProfile } from './AgentCandidateProfile'

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('pt-PT')
  } catch {
    return value
  }
}

export function AdminAgentsPanel({
  siteUsers,
  agentApplications,
  approvedAgents,
  onCreateCandidate,
  onSendTest,
  onApprove,
  onReject,
  onRevoke,
  onRetest,
}) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteUsername, setInviteUsername] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [inviteNote, setInviteNote] = useState('')
  const [copiedId, setCopiedId] = useState('')
  const [rejectDraft, setRejectDraft] = useState({})

  function handleInvite(event) {
    event.preventDefault()
    const created = onCreateCandidate({
      email: inviteEmail,
      username: inviteUsername,
      phone: invitePhone,
      note: inviteNote,
    })
    if (created) {
      setInviteEmail('')
      setInviteUsername('')
      setInvitePhone('')
      setInviteNote('')
    }
  }

  function copyLink(application) {
    if (!application.testToken) return
    const link = buildTestLink(application.testToken)
    navigator.clipboard?.writeText(link)
    setCopiedId(application.id)
    window.setTimeout(() => setCopiedId(''), 2500)
  }

  return (
    <>
      <form className="panel-card admin-agent-invite" onSubmit={handleInvite}>
        <h3>Convidar candidato</h3>
        <p>Pesquise nos utilizadores registados ou introduza email / nome manualmente.</p>
        <div className="form-row">
          <label>
            Email
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="exemplo@gmail.com"
            />
          </label>
          <label>
            Nome / username
            <input
              value={inviteUsername}
              onChange={(event) => setInviteUsername(event.target.value)}
              placeholder="Nome completo"
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Telefone (opcional)
            <input
              value={invitePhone}
              onChange={(event) => setInvitePhone(event.target.value)}
              placeholder="+244 9XX XXX XXX"
            />
          </label>
          <label>
            Nota interna
            <input
              value={inviteNote}
              onChange={(event) => setInviteNote(event.target.value)}
              placeholder="Referência ou origem do contacto"
            />
          </label>
        </div>
        <button className="button primary" type="submit">
          Registar candidato
        </button>
      </form>

      {siteUsers.length ? (
        <div className="panel-card admin-agent-users">
          <strong>Utilizadores no site — clique para preencher convite</strong>
          <ul className="admin-agent-user-pick">
            {siteUsers.map((user) => (
              <li key={user.email}>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setInviteEmail(user.email)
                    setInviteUsername(user.name || '')
                  }}
                >
                  {user.name} — {user.email}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="admin-agent-applications">
        {agentApplications.length === 0 ? (
          <div className="empty-state panel-card">
            <p>Nenhuma candidatura a agente.</p>
          </div>
        ) : (
          agentApplications.map((application) => {
            const attempt = application.testAttempt
            const scoreLabel = attempt?.submittedAt
              ? `${attempt.score}/${AGENT_TEST_TOTAL_QUESTIONS} — ${attempt.passed ? 'Aprovado' : 'Reprovado'}`
              : 'Teste não realizado'

            return (
              <article className="admin-agent-card panel-card" key={application.id}>
                <div className="admin-agent-card-head">
                  <div>
                    <strong>{application.username}</strong>
                    <p>
                      {application.email}
                      {application.phone ? ` • ${application.phone}` : ''}
                    </p>
                    <small>Candidatura: {formatDate(application.createdAt)}</small>
                  </div>
                  <span className={`status-pill status-${application.status}`}>
                    {AGENT_APPLICATION_STATUS_LABELS[application.status] || application.status}
                  </span>
                </div>

                <AgentCandidateProfile application={application} />

                <p className="admin-agent-score">
                  <strong>Resultado do teste:</strong> {scoreLabel}
                </p>
                {attempt?.submittedAt ? (
                  <small>Submetido: {formatDate(attempt.submittedAt)}</small>
                ) : null}

                {attempt?.review?.length ? (
                  <details className="admin-agent-review">
                    <summary>
                      Ver respostas ({attempt.score} certas, {attempt.errorCount} erradas)
                    </summary>
                    <ol className="admin-agent-review-list">
                      {attempt.review.map((item, index) => (
                        <li key={item.questionId} className={item.correct ? 'ok' : 'bad'}>
                          {index + 1}. {item.correct ? '✓' : '✗'} {item.question}
                        </li>
                      ))}
                    </ol>
                  </details>
                ) : null}

                <div className="admin-actions">
                  {application.status !== AGENT_APPLICATION_STATUS.APPROVED ? (
                    <button type="button" className="button primary" onClick={() => onSendTest(application.id)}>
                      {application.testToken ? 'Reenviar link do teste' : 'Enviar teste (25 perguntas)'}
                    </button>
                  ) : null}
                  {application.testToken ? (
                    <>
                      <button type="button" className="button filter-button" onClick={() => copyLink(application)}>
                        {copiedId === application.id ? 'Link copiado!' : 'Copiar link do teste'}
                      </button>
                      <a
                        className="button filter-button"
                        href={buildAgentTestMailto(application, buildTestLink(application.testToken))}
                      >
                        Enviar link por email
                      </a>
                    </>
                  ) : null}
                  {application.status === AGENT_APPLICATION_STATUS.PASSED ? (
                    <button type="button" className="button primary" onClick={() => onApprove(application.id)}>
                      Aprovar como agente
                    </button>
                  ) : null}
                  {application.status === AGENT_APPLICATION_STATUS.FAILED ? (
                    <button type="button" onClick={() => onRetest(application.id)}>
                      Nova tentativa
                    </button>
                  ) : null}
                  {application.status !== AGENT_APPLICATION_STATUS.APPROVED ? (
                    <>
                      <button
                        type="button"
                        className="button filter-button"
                        onClick={() =>
                          onReject(application.id, rejectDraft[application.id] || 'Não cumpre requisitos.')
                        }
                      >
                        Recusar candidatura
                      </button>
                      <input
                        placeholder="Motivo da recusa (opcional)"
                        value={rejectDraft[application.id] || ''}
                        onChange={(event) =>
                          setRejectDraft((current) => ({
                            ...current,
                            [application.id]: event.target.value,
                          }))
                        }
                      />
                    </>
                  ) : null}
                </div>
              </article>
            )
          })
        )}
      </div>

      <div className="panel-card admin-agent-active">
        <h3>Agentes activos ({approvedAgents.length})</h3>
        {approvedAgents.length === 0 ? (
          <p>Nenhum agente aprovado.</p>
        ) : (
          <ul className="admin-agent-active-list">
            {approvedAgents.map((agent) => (
              <li key={agent.email}>
                <span>
                  <strong>{agent.name || agent.email}</strong> — {agent.email}
                  <small> Desde {formatDate(agent.approvedAt)}</small>
                </span>
                {agent.approvedBy !== 'system' ? (
                  <button type="button" onClick={() => onRevoke(agent.email)}>
                    Remover acesso
                  </button>
                ) : (
                  <small>Conta seed</small>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="admin-agent-rule">
          Regra do teste: {AGENT_TEST_TOTAL_QUESTIONS} perguntas — mínimo {AGENT_TEST_PASS_SCORE} correctas (máximo 5
          erros).
        </p>
      </div>
    </>
  )
}
