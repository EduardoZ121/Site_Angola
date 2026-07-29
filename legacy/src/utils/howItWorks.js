export const HOW_IT_WORKS_ROLES = [
  { id: 'buyer', label: 'Comprador / arrendatário', stepsKey: 'buyer' },
  { id: 'owner', label: 'Proprietário', stepsKey: 'owner' },
  { id: 'agent', label: 'Agente', stepsKey: 'agent' },
]

export const HOW_IT_WORKS_FAQ = [
  {
    question: 'Preciso de conta para pesquisar?',
    answer: 'Não. Pode explorar comprar, arrendar e veículos sem entrar. A conta é necessária para contactar, guardar favoritos e publicar.',
  },
  {
    question: 'Como contacto o anunciante?',
    answer: 'Na página do anúncio encontra telefone, WhatsApp, email e mensagem interna. Precisa de entrar na conta para enviar mensagem.',
  },
  {
    question: 'Quanto custa publicar?',
    answer: 'A publicação base é gratuita (demo). Planos destaque estão disponíveis no painel do proprietário para maior visibilidade.',
  },
  {
    question: 'Os preços incluem taxas?',
    answer: 'Os valores são indicados pelo anunciante em Kz. Arrendamentos mostram renda mensal. Confirme condições directamente com o senhorio.',
  },
]

export function getStepsForRole(roleId, { homeSteps, homeOwnerSteps, homeAgentSteps }) {
  if (roleId === 'owner') return homeOwnerSteps
  if (roleId === 'agent') return homeAgentSteps
  return homeSteps
}
