export const agenteCopyPt = {
  title: 'Agente Certificado',
  subtitle:
    'Represente a Kuteka no terreno: defina a sua cobertura, explore inventário activo e active acompanhamentos.',
  explore: 'Explorar inventário',
  preferencesTitle: 'Preferências de cobertura',
  preferencesHint: 'Indique a zona e finalidade em que pretende actuar.',
  savePreferences: 'Guardar preferências',
  saving: 'A guardar…',
  saved: 'Preferências guardadas.',
  needAgent:
    'A área Agente está reservada a Agentes Certificados. Se já colabora com a Kuteka, contacte a equipa para activar o seu acesso.',
  loadError: 'Não foi possível carregar a área Agente. Tente novamente.',
  saveError: 'Não foi possível guardar. Tente novamente.',
  forbidden: 'Não tem permissão de Agente Certificado.',
  exploreTitle: 'Inventário activo',
  exploreSubtitle: 'Patrimónios disponíveis para acompanhamento responsável no terreno.',
  emptyExploreTitle: 'Nenhum património nesta cobertura',
  emptyExplore:
    'Não há patrimónios activos com os filtros actuais. Ajuste a cobertura ou explore novamente mais tarde.',
  emptyAssignmentsTitle: 'Sem acompanhamentos activos',
  emptyAssignments:
    'Quando activar um acompanhamento, fica registado aqui para acompanhar o seu trabalho de campo.',
  emptyAssignmentsCta: 'Explorar inventário',
  assignmentsTitle: 'Acompanhamentos activos',
  activate: 'Activar Acompanhamento',
  activating: 'A activar…',
  activated: 'Acompanhamento activado.',
  alreadyAssigned: 'Já tem acompanhamento activo neste património.',
  backToHub: 'Voltar à área Agente',
  backToExplore: 'Voltar ao inventário',
  detailTitle: 'Património para acompanhamento',
  openDetail: 'Abrir ficha',
  mvpNote:
    'Foque-se em cobertura e acompanhamentos. Visitas, propostas e Academia serão introduzidas em fases seguintes.',
  fields: {
    purpose: 'Finalidade',
    province: 'Província',
    city: 'Cidade',
    type: 'Tipo',
    address: 'Morada',
    code: 'Código',
    notes: 'Notas de campo (opcional)',
    any: 'Qualquer',
    status: 'Estado',
  },
  types: {
    apartment: 'Apartamento',
    house: 'Moradia',
    land: 'Terreno',
    commercial: 'Comercial',
  },
  purposes: {
    rent: 'Arrendamento',
    sale: 'Venda',
    both: 'Venda e arrendamento',
  },
  statuses: {
    active: 'Activo',
    released: 'Libertado',
  },
} as const;

export function getAgenteCopy() {
  return agenteCopyPt;
}
