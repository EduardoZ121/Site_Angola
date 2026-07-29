import {
  AGENT_TEST_MAX_ERRORS,
  AGENT_TEST_PASS_SCORE,
  AGENT_TEST_TOTAL_QUESTIONS,
  isAgentTestPassed,
} from '../constants/agentApplication'
import { AGENT_TEST_QUESTIONS } from '../data/agentTestQuestions'
import { normalizeStaffEmail } from '../constants/staff'

export function createApplicationId() {
  return `app-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function createTestToken() {
  return `tst-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function shuffleArray(items) {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

export function buildTestAttempt() {
  const questionOrder = shuffleArray(AGENT_TEST_QUESTIONS.map((item) => item.id))
  return {
    questionOrder,
    answers: {},
    startedAt: new Date().toISOString(),
    submittedAt: null,
    score: null,
    passed: null,
    errorCount: null,
    review: [],
  }
}

export function gradeTestAttempt(attempt) {
  const review = attempt.questionOrder.map((questionId) => {
    const question = AGENT_TEST_QUESTIONS.find((item) => item.id === questionId)
    const selectedIndex = attempt.answers[questionId]
    const correct = selectedIndex === question?.correctIndex
    return {
      questionId,
      selectedIndex: selectedIndex ?? null,
      correctIndex: question?.correctIndex ?? null,
      correct,
      question: question?.question ?? '',
      explanation: question?.explanation ?? '',
      difficulty: question?.difficulty ?? 'medium',
    }
  })

  const score = review.filter((item) => item.correct).length
  const errorCount = AGENT_TEST_TOTAL_QUESTIONS - score
  const passed = isAgentTestPassed(score)

  return {
    ...attempt,
    submittedAt: new Date().toISOString(),
    score,
    errorCount,
    passed,
    review,
  }
}

export function getTestSummaryMessage(score, passed) {
  const errors = AGENT_TEST_TOTAL_QUESTIONS - score
  if (passed) {
    return `Aprovado com ${score}/${AGENT_TEST_TOTAL_QUESTIONS} (${errors} erro${errors === 1 ? '' : 's'}). A equipa Kuteka analisará a candidatura.`
  }
  if (errors > AGENT_TEST_MAX_ERRORS) {
    return `Reprovado: ${score}/${AGENT_TEST_TOTAL_QUESTIONS}. Máximo permitido: ${AGENT_TEST_MAX_ERRORS} erros (teve ${errors}).`
  }
  return `Reprovado: precisa de pelo menos ${AGENT_TEST_PASS_SCORE} respostas correctas. Obteve ${score}.`
}

export function findApplicationByToken(applications, token) {
  return applications.find((item) => item.testToken === token)
}

export function findApplicationForProfile(applications, profile) {
  const email = normalizeStaffEmail(profile.email)
  const username = profile.name?.trim().toLowerCase()
  return applications.find((item) => {
    if (normalizeStaffEmail(item.email) === email) return true
    if (username && item.username?.trim().toLowerCase() === username) return true
    return false
  })
}

export function buildTestLink(token) {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/agente/avaliacao/${token}`
  }
  return `/agente/avaliacao/${token}`
}

export function getQuestionById(id) {
  return AGENT_TEST_QUESTIONS.find((item) => item.id === id)
}

const CV_MAX_BYTES = 1_500_000
const DESCRIPTION_MIN_LENGTH = 80

export function validateAgentApplicationPayload({ description, cvFileData, cvFileName }) {
  const errors = []
  const cleanDescription = description?.trim() || ''
  if (!cleanDescription) {
    errors.push('Escreva uma apresentação pessoal.')
  } else if (cleanDescription.length < DESCRIPTION_MIN_LENGTH) {
    errors.push(`A apresentação deve ter pelo menos ${DESCRIPTION_MIN_LENGTH} caracteres.`)
  }
  if (cvFileData && cvFileData.length > CV_MAX_BYTES * 1.37) {
    errors.push('O ficheiro CV é demasiado grande (máximo ~1,5 MB).')
  }
  if (cvFileName && !cvFileData) {
    errors.push('Seleccione novamente o ficheiro CV.')
  }
  return errors
}

export function buildAgentTestMailto(application, link) {
  const subject = encodeURIComponent('Teste de qualificação — Agente Kuteka')
  const body = encodeURIComponent(
    `Olá ${application.username},\n\n` +
      `Segue o link para o teste de intermediário Kuteka (${AGENT_TEST_TOTAL_QUESTIONS} perguntas):\n\n` +
      `${link}\n\n` +
      `Entre com o email ${application.email}. Precisa de pelo menos ${AGENT_TEST_PASS_SCORE} respostas correctas.\n\n` +
      `Equipa Kuteka`,
  )
  return `mailto:${application.email}?subject=${subject}&body=${body}`
}
