export const administracaoCopyPt = {
  title: 'Administração',
  subtitle: 'Dashboard operacional — contas, patrimónios, agentes, verificações e pedidos.',
  permissionBadge: 'admin.panel',
  users: 'Utilizadores',
  usersTitle: 'Utilizadores e papéis',
  usersHint: 'Leitura das contas e atribuição do papel Agente Certificado.',
  trustReview: 'Verificações',
  housingExplore: 'Patrimónios (vista Cliente)',
  contracts: 'Contratos',
  backToHub: 'Voltar à Administração',
  assignAgent: 'Atribuir Agente Certificado',
  assigning: 'A atribuir…',
  assigned: 'Papel Agente Certificado atribuído.',
  alreadyAgent: 'Este utilizador já é Agente Certificado.',
  emptyUsersTitle: 'Sem utilizadores',
  emptyUsers: 'Ainda não há perfis para mostrar.',
  statsTitle: 'Resumo da plataforma',
  statsHint: 'Indicadores operacionais interligados dos módulos activos.',
  pendingTitle: 'Pedidos pendentes',
  pendingHint: 'Interesses de Cliente a aguardar acompanhamento.',
  emptyPending: 'Sem pedidos pendentes neste momento.',
  openProperty: 'Abrir património',
  stats: {
    profiles: 'Utilizadores',
    properties: 'Patrimónios activos',
    assignments: 'Acompanhamentos activos',
    agents: 'Agentes Certificados',
    trust: 'Verificações pendentes',
    interests: 'Interesses pendentes',
    demo: 'Anúncios demo',
    contractsActive: 'Contratos activos',
    contractsPending: 'Contratos pendentes',
  },
  loadError: 'Não foi possível carregar a Administração. Tente novamente.',
  forbidden: 'Não tem permissão para aceder à Administração (admin.panel).',
  mvpNote:
    'Dashboard vivo: navegue para utilizadores, revisão de Confiança e inventário do Cliente.',
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
