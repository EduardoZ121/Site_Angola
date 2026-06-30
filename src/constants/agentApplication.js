/** Avaliação de candidatos a agente Kuteka — estilo teste teórico (RSA). */

export const AGENT_TEST_TOTAL_QUESTIONS = 25
export const AGENT_TEST_PASS_SCORE = 20
export const AGENT_TEST_MAX_ERRORS = 5

export const AGENT_APPLICATION_STATUS = {
  SUBMITTED: 'submitted',
  INVITED: 'invited',
  PASSED: 'passed',
  FAILED: 'failed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

export const AGENT_APPLICATION_STATUS_LABELS = {
  submitted: 'Candidatura recebida',
  invited: 'Convite enviado',
  passed: 'Teste aprovado',
  failed: 'Teste reprovado',
  approved: 'Agente activo',
  rejected: 'Candidatura recusada',
}

export function isAgentTestPassed(score) {
  return score >= AGENT_TEST_PASS_SCORE
}

export function agentTestErrors(score) {
  return AGENT_TEST_TOTAL_QUESTIONS - score
}
