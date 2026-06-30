import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import {
  AGENT_APPLICATION_STATUS,
  AGENT_APPLICATION_STATUS_LABELS,
  AGENT_TEST_PASS_SCORE,
  AGENT_TEST_TOTAL_QUESTIONS,
} from '../constants/agentApplication'
import { buildTestLink } from '../utils/agentApplication'
import { PageIntro, SectionBlock } from '../components/SectionBlock'

export default function AgentApplyPage() {
  const { isLoggedIn, isAgent, isAdmin, profile, submitAgentApplication, getMyAgentApplication } = useMarketplace()
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const application = getMyAgentApplication()

  if (!isLoggedIn) {
    return <Navigate to="/entrar?redirect=%2Fseja-agente" replace />
  }

  if (isAgent || isAdmin) {
    return <Navigate to={isAdmin ? '/admin' : '/agente'} replace />
  }

  function handleApply(event) {
    event.preventDefault()
    submitAgentApplication(message)
    setSubmitted(true)
  }

  const testLink = application?.testToken ? buildTestLink(application.testToken) : null

  return (
    <main className="page-main">
      <PageIntro
        eyebrow="Carreira Kuteka"
        title="Seja agente intermediário"
        subtitle="Represente a Kuteka, aprove anúncios, responda clientes e planee visitas — com formação e supervisão."
      />

      <SectionBlock id="como-funciona" eyebrow="Processo" title="Como funciona">
        <ol className="agent-apply-steps panel-card">
          <li>Crie conta no site com o seu email real.</li>
          <li>Envie candidatura — a administração analisa o seu perfil.</li>
          <li>Recebe link por email (demo) para teste de {AGENT_TEST_TOTAL_QUESTIONS} perguntas.</li>
          <li>Precisa de pelo menos {AGENT_TEST_PASS_SCORE} correctas (máximo 5 erros).</li>
          <li>Se aprovado no teste, o admin confirma e activa o painel de agente.</li>
        </ol>
      </SectionBlock>

      <SectionBlock id="candidatura" eyebrow="Candidatura" title="Enviar pedido">
        {application ? (
          <div className="panel-card agent-apply-status">
            <strong>Estado: {AGENT_APPLICATION_STATUS_LABELS[application.status] || application.status}</strong>
            {application.status === AGENT_APPLICATION_STATUS.INVITED && testLink ? (
              <>
                <p>O administrador enviou o teste. Use o mesmo email ({application.email}).</p>
                <Link className="button primary" to={`/agente/avaliacao/${application.testToken}`}>
                  Iniciar teste de qualificação
                </Link>
              </>
            ) : null}
            {application.status === AGENT_APPLICATION_STATUS.SUBMITTED ? (
              <p>A administração vai contactá-lo para enviar o link do teste.</p>
            ) : null}
            {application.testAttempt?.submittedAt ? (
              <p>
                Último resultado: {application.testAttempt.score}/{AGENT_TEST_TOTAL_QUESTIONS} —{' '}
                {application.testAttempt.passed ? 'Aprovado' : 'Reprovado'}
              </p>
            ) : null}
          </div>
        ) : null}

        {!application || application.status === AGENT_APPLICATION_STATUS.REJECTED ? (
          <form className="panel-card agent-apply-form" onSubmit={handleApply}>
            <label>
              Porque quer ser agente Kuteka?
              <textarea
                rows={4}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Experiência com clientes, zona de actuação, disponibilidade..."
              />
            </label>
            <p className="agent-apply-meta">
              Perfil: {profile.name} • {profile.email} • {profile.phone || 'telefone por definir'}
            </p>
            <button className="button primary" type="submit" disabled={submitted && !application}>
              {submitted ? 'Candidatura enviada' : 'Enviar candidatura'}
            </button>
          </form>
        ) : null}
      </SectionBlock>
    </main>
  )
}
