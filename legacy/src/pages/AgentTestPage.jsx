import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import {
  AGENT_TEST_MAX_ERRORS,
  AGENT_TEST_PASS_SCORE,
  AGENT_TEST_TOTAL_QUESTIONS,
} from '../constants/agentApplication'
import { getQuestionById, getTestSummaryMessage } from '../utils/agentApplication'
import { CatalogBreadcrumbs } from '../components/catalog/CatalogBreadcrumbs'
import { AgentApplyCrossNav } from '../components/agent/AgentApplyCrossNav'
import { HelpTip } from '../components/ui/HelpTip'
import { PageIntro, SectionBlock } from '../components/SectionBlock'
import '../styles/agent-test.css'
import '../styles/agent.css'

export default function AgentTestPage() {
  const { token } = useParams()
  const { isLoggedIn, profile, getAgentApplicationByToken, submitAgentTest } = useMarketplace()
  const application = getAgentApplicationByToken(token)

  useEffect(() => {
    document.title = application ? 'Teste agente | Kuteka' : 'Avaliação | Kuteka'
  }, [application])

  const [answers, setAnswers] = useState({})
  const [step, setStep] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const questionOrder = application?.testAttempt?.questionOrder || []
  const currentQuestionId = questionOrder[step]
  const currentQuestion = getQuestionById(currentQuestionId)
  const submitted = Boolean(application?.testAttempt?.submittedAt)
  const displayAttempt = result?.attempt || application?.testAttempt

  const answeredCount = useMemo(
    () => questionOrder.filter((id) => answers[id] !== undefined).length,
    [answers, questionOrder],
  )

  if (!application) {
    return (
      <main className="page-main agent-test-page">
        <PageIntro eyebrow="Avaliação" title="Convite inválido" subtitle="Este link não existe ou expirou." />
        <div className="agent-page-body section-block-inner">
          <div className="empty-state panel-card">
            <Link className="button primary" to="/seja-agente">
              Saber como ser agente
            </Link>
          </div>
          <AgentApplyCrossNav />
        </div>
      </main>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to={`/entrar?redirect=${encodeURIComponent(`/agente/avaliacao/${token}`)}`} replace />
  }

  const emailMismatch = profile.email?.trim().toLowerCase() !== application.email

  function selectAnswer(optionIndex) {
    if (!currentQuestionId) return
    setAnswers((prev) => ({ ...prev, [currentQuestionId]: optionIndex }))
  }

  function handleSubmit() {
    setError('')
    const missing = questionOrder.filter((id) => answers[id] === undefined)
    if (missing.length) {
      setError(`Responda todas as perguntas (${missing.length} em falta).`)
      return
    }
    const response = submitAgentTest(token, answers)
    if (response?.error) {
      setError(response.error)
      return
    }
    setResult(response)
  }

  if (emailMismatch) {
    return (
      <main className="page-main agent-test-page">
        <PageIntro
          eyebrow="Avaliação Kuteka"
          title="Email incorrecto"
          subtitle={`Este teste foi enviado para ${application.email}. Entrou como ${profile.email}.`}
        />
        <div className="agent-page-body section-block-inner">
          <div className="panel-card agent-access-denied">
            <p>Termine sessão e entre com o email correcto para responder ao teste.</p>
            <Link className="button primary" to={`/entrar?redirect=${encodeURIComponent(`/agente/avaliacao/${token}`)}`}>
              Entrar com {application.email}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (submitted || result) {
    const attempt = displayAttempt
    return (
      <main className="page-main agent-test-page">
        <PageIntro
          eyebrow="Resultado"
          title={attempt.passed ? 'Teste aprovado' : 'Teste reprovado'}
          subtitle={getTestSummaryMessage(attempt.score, attempt.passed)}
        />

        <div className="agent-page-body section-block-inner">
          <CatalogBreadcrumbs
            items={[
              { label: 'Seja agente', to: '/seja-agente' },
              { label: 'Resultado', to: `/agente/avaliacao/${token}` },
            ]}
          />

          <SectionBlock title="Resumo" id="resultado">
          <div className={`agent-test-result panel-card ${attempt.passed ? 'passed' : 'failed'}`}>
            <div className="agent-test-score-ring">
              <strong>{attempt.score}</strong>
              <span>/ {AGENT_TEST_TOTAL_QUESTIONS}</span>
            </div>
            <ul className="agent-test-result-meta">
              <li>Correctas: {attempt.score}</li>
              <li>Erros: {attempt.errorCount}</li>
              <li>Mínimo exigido: {AGENT_TEST_PASS_SCORE}</li>
              <li>Máximo de erros: {AGENT_TEST_MAX_ERRORS}</li>
            </ul>
            <p>
              {attempt.passed
                ? 'A administração Kuteka vai confirmar o seu acesso ao painel de agente.'
                : 'Peça à administração um novo convite quando estiver pronto para tentar novamente.'}
            </p>
          </div>
        </SectionBlock>

        <SectionBlock title="Revisão das respostas" id="revisao" tone="muted">
          <div className="agent-test-review">
            {attempt.review?.map((item, index) => (
              <article
                className={`agent-test-review-item panel-card ${item.correct ? 'correct' : 'wrong'}`}
                key={item.questionId}
              >
                <span className="agent-test-review-num">
                  {index + 1} • {item.difficulty}
                </span>
                <strong>{item.question}</strong>
                <p>{item.correct ? 'Resposta correcta' : 'Resposta incorrecta'}</p>
                <small>{item.explanation}</small>
              </article>
            ))}
          </div>
          </SectionBlock>

          <div className="agent-test-result-actions">
            <Link className="button primary" to="/conta">
              Voltar à conta
            </Link>
            <Link className="button filter-button" to="/seja-agente">
              Estado da candidatura
            </Link>
          </div>

          <AgentApplyCrossNav />
        </div>
      </main>
    )
  }

  return (
    <main className="page-main agent-test-page">
      <PageIntro
        eyebrow="Teste de agente Kuteka"
        title={`Pergunta ${step + 1} de ${AGENT_TEST_TOTAL_QUESTIONS}`}
        subtitle="Estilo avaliação teórica — atendimento, ética, imóveis e veículos em Angola."
      />

      <div className="agent-page-body section-block-inner">
        <CatalogBreadcrumbs
          items={[
            { label: 'Seja agente', to: '/seja-agente' },
            { label: 'Teste', to: `/agente/avaliacao/${token}` },
          ]}
        />

        <p className="agent-help-line">
          Responda todas as perguntas — mínimo {AGENT_TEST_PASS_SCORE} correctas para passar.
          <HelpTip
            label="Ajuda: teste"
            text={`${AGENT_TEST_TOTAL_QUESTIONS} perguntas sobre ética, imóveis e veículos em Angola. Máximo ${AGENT_TEST_MAX_ERRORS} erros.`}
          />
        </p>

        <div className="agent-test-progress panel-card">
        <div className="agent-test-progress-bar">
          <span style={{ width: `${((step + 1) / AGENT_TEST_TOTAL_QUESTIONS) * 100}%` }} />
        </div>
        <small>
          {answeredCount}/{AGENT_TEST_TOTAL_QUESTIONS} respondidas • mínimo {AGENT_TEST_PASS_SCORE} correctas
        </small>
      </div>

      {currentQuestion ? (
        <section className="agent-test-question panel-card">
          <span className="agent-test-tag">{currentQuestion.topic}</span>
          <h2>{currentQuestion.question}</h2>
          <div className="agent-test-options">
            {currentQuestion.options.map((option, index) => (
              <button
                key={option}
                type="button"
                className={`agent-test-option${answers[currentQuestionId] === index ? ' selected' : ''}`}
                onClick={() => selectAnswer(index)}
              >
                {option}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {error ? <p className="agent-test-error">{error}</p> : null}

      <div className="agent-test-nav">
        <button type="button" className="button filter-button" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Anterior
        </button>
        {step < AGENT_TEST_TOTAL_QUESTIONS - 1 ? (
          <button type="button" className="button primary" onClick={() => setStep((s) => s + 1)}>
            Seguinte
          </button>
        ) : (
          <button type="button" className="button primary" onClick={handleSubmit}>
            Submeter teste
          </button>
        )}
      </div>
      </div>
    </main>
  )
}
