export const administracaoCopyPt = {
  title: 'Administração',
  subtitle: 'Operação da plataforma Kuteka — contas, papéis e resumo operacional.',
  permissionBadge: 'admin.panel',
  users: 'Utilizadores',
  usersTitle: 'Utilizadores e papéis',
  usersHint: 'Leitura das contas e atribuição do papel Agente Certificado.',
  trustReview: 'Revisão Confiança',
  backToHub: 'Voltar à Administração',
  assignAgent: 'Atribuir Agente Certificado',
  assigning: 'A atribuir…',
  assigned: 'Papel Agente Certificado atribuído.',
  alreadyAgent: 'Este utilizador já é Agente Certificado.',
  emptyUsersTitle: 'Sem utilizadores',
  emptyUsers: 'Ainda não há perfis para mostrar.',
  statsTitle: 'Resumo da plataforma',
  statsHint: 'Indicadores operacionais dos módulos activos.',
  stats: {
    profiles: 'Contas',
    properties: 'Patrimónios activos',
    assignments: 'Acompanhamentos activos',
    agents: 'Agentes Certificados',
  },
  loadError: 'Não foi possível carregar a Administração. Tente novamente.',
  forbidden: 'Não tem permissão para aceder à Administração (admin.panel).',
  mvpNote:
    'MVP de operação: resumo, listagem e atribuição de Agente. Painéis avançados virão depois.',
  roleLabels: {
    client: 'Cliente',
    patrimonial_partner: 'Parceiro Patrimonial',
    certified_agent: 'Agente Certificado',
    administrator: 'Administrador',
  },
} as const;

export function getAdministracaoCopy() {
  return administracaoCopyPt;
}
