import { useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext'
import {
  AGENT_APPLICATION_STATUS,
  AGENT_APPLICATION_STATUS_LABELS,
  AGENT_TEST_PASS_SCORE,
  AGENT_TEST_TOTAL_QUESTIONS,
} from '../constants/agentApplication'
import { buildTestLink } from '../utils/agentApplication'
import { AgentCandidateProfile } from '../components/staff/AgentCandidateProfile'
import { PageIntro, SectionBlock } from '../components/SectionBlock'
import '../styles/agent-test.css'

const CV_MAX_BYTES = 1_500_000

export default function AgentApplyPage() {
  const { isLoggedIn, isAgent, isAdmin, profile, submitAgentApplication, getMyAgentApplication } =
    useMarketplace()
  const fileRef = useRef(null)

  const [description, setDescription] = useState('')
  const [cvText, setCvText] = useState('')
  const [cvFileName, setCvFileName] = useState('')
  const [cvFileData, setCvFileData] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const application = getMyAgentApplication()
  const canApply = !application || application.status === AGENT_APPLICATION_STATUS.REJECTED
  const testPath = application?.testToken ? `/agente/avaliacao/${application.testToken}` : null
  const testLink = application?.testToken ? buildTestLink(application.testToken) : null

  if (!isLoggedIn) {
    return <Navigate to="/entrar?redirect=%2Fseja-agente" replace />
  }

  if (isAgent || isAdmin) {
    return <Navigate to={isAdmin ? '/admin' : '/agente'} replace />
  }

  function handleCvFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > CV_MAX_BYTES) {
      setError('CV demasiado grande. Máximo 1,5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setCvFileName(file.name)
      setCvFileData(String(reader.result))
      setError('')
    }
    reader.readAsDataURL(file)
  }

  function clearCvFile() {
    setCvFileName('')
    setCvFileData('')
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleApply(event) {
    event.preventDefault()
    setError('')
    const result = submitAgentApplication({ description, cvText, cvFileName, cvFileData })
    if (result?.error) {
      setError(result.error)
      return
    }
    setDescription('')
    setCvText('')
    clearCvFile()
  }

  function copyTestLink() {
    if (!testLink) return
    navigator.clipboard?.writeText(testLink)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2500)
  }

  return (
    <main className="page-main">
      <PageIntro
        eyebrow="Carreira Kuteka"
        title="Seja agente intermediário"
        subtitle="Apresente-se, envie CV opcional e complete o teste de qualificação quando a administração convidar."
      />

      <SectionBlock id="como-funciona" eyebrow="Processo" title="Como funciona">
        <ol className="agent-apply-steps panel-card">
          <li>Crie conta com email real e complete telefone em Minha conta.</li>
          <li>Envie apresentação pessoal e CV (opcional).</li>
          <li>A administração analisa e envia link do teste — por email ou aqui nesta página.</li>
          <li>Teste com {AGENT_TEST_TOTAL_QUESTIONS} perguntas — mínimo {AGENT_TEST_PASS_SCORE} correctas.</li>
          <li>Se aprovado, o admin activa o painel de agente.</li>
        </ol>
      </SectionBlock>

      {application ? (
        <SectionBlock id="estado" eyebrow="A sua candidatura" title="Estado actual">
          <div className="panel-card agent-apply-status">
            <strong>{AGENT_APPLICATION_STATUS_LABELS[application.status] || application.status}</strong>

            <AgentCandidateProfile application={application} />

            {application.status === AGENT_APPLICATION_STATUS.SUBMITTED ? (
              <p>A administração está a analisar a sua apresentação. Receberá o link do questionário em breve.</p>
            ) : null}

            {application.status === AGENT_APPLICATION_STATUS.INVITED && testPath ? (
              <div className="agent-test-invite-box">
                <p>
                  <strong>Questionário disponível.</strong> Entre com {application.email} e responda às{' '}
                  {AGENT_TEST_TOTAL_QUESTIONS} perguntas.
                </p>
                <div className="agent-test-invite-actions">
                  <Link className="button primary" to={testPath}>
                    Iniciar teste de qualificação
                  </Link>
                  <button type="button" className="button filter-button" onClick={copyTestLink}>
                    {copied ? 'Link copiado!' : 'Copiar link do teste'}
                  </button>
                </div>
                <small className="agent-apply-meta">
                  Também pode receber este link por email da administração Kuteka.
                </small>
              </div>
            ) : null}

            {application.testAttempt?.submittedAt ? (
              <p>
                Último resultado: {application.testAttempt.score}/{AGENT_TEST_TOTAL_QUESTIONS} —{' '}
                {application.testAttempt.passed ? 'Aprovado no teste' : 'Reprovado — aguarde novo convite'}
              </p>
            ) : null}

            {application.status === AGENT_APPLICATION_STATUS.REJECTED ? (
              <p>Pode enviar nova candidatura abaixo.</p>
            ) : null}
          </div>
        </SectionBlock>
      ) : null}

      {canApply ? (
        <SectionBlock id="candidatura" eyebrow="Candidatura" title="Apresentação e CV">
          <form className="panel-card agent-apply-form" onSubmit={handleApply}>
            <label className="publish-field">
              Apresentação pessoal *
              <textarea
                rows={6}
                required
                minLength={80}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Quem é, experiência com clientes ou imóveis, zona onde actua, disponibilidade, idiomas..."
              />
              <span className="publish-field-hint">Mínimo 80 caracteres. O administrador lê isto antes do teste.</span>
            </label>

            <label className="publish-field">
              Currículo em texto (opcional)
              <textarea
                rows={5}
                value={cvText}
                onChange={(event) => setCvText(event.target.value)}
                placeholder="Formação, empregos anteriores, certificações..."
              />
            </label>

            <div className="agent-cv-upload">
              <label className="publish-field">
                Ou anexar CV (PDF, máx. 1,5 MB)
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf"
                  onChange={handleCvFile}
                />
              </label>
              {cvFileName ? (
                <p className="agent-cv-file-line">
                  Ficheiro: {cvFileName}{' '}
                  <button type="button" className="text-button" onClick={clearCvFile}>
                    Remover
                  </button>
                </p>
              ) : null}
            </div>

            <p className="agent-apply-meta">
              Perfil: {profile.name} • {profile.email} • {profile.phone || 'adicione telefone em Minha conta'}
            </p>

            {error ? <p className="agent-test-error">{error}</p> : null}

            <button className="button primary" type="submit">
              Enviar candidatura
            </button>
          </form>
        </SectionBlock>
      ) : null}
    </main>
  )
}
