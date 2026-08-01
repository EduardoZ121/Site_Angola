export const agenteCopyPt = {
  title: 'Agente',
  subtitle: 'Cobertura de terreno — preferências, discovery e acompanhamentos.',
  explore: 'Explorar patrimónios',
  preferencesTitle: 'Preferências de cobertura',
  preferencesHint: 'Filtros iniciais para a exploração no terreno.',
  savePreferences: 'Guardar preferências',
  saving: 'A guardar…',
  saved: 'Preferências guardadas.',
  needAgent:
    'Para usar a área Agente, a Kuteka tem de atribuir o papel Agente Certificado à sua conta.',
  loadError: 'Não foi possível carregar a área Agente. Tente novamente.',
  saveError: 'Não foi possível guardar. Tente novamente.',
  forbidden: 'Não tem permissão de Agente Certificado.',
  exploreTitle: 'Explorar patrimónios activos',
  exploreSubtitle: 'Inventário activo para acompanhamento no terreno.',
  emptyExplore: 'Não há patrimónios activos com estes filtros.',
  emptyAssignments: 'Ainda não activou nenhum acompanhamento.',
  assignmentsTitle: 'Os seus acompanhamentos',
  activate: 'Activar Acompanhamento',
  activating: 'A activar…',
  activated: 'Acompanhamento activado.',
  alreadyAssigned: 'Já tem acompanhamento activo neste património.',
  backToHub: 'Voltar ao Agente',
  backToExplore: 'Voltar à exploração',
  detailTitle: 'Detalhe para acompanhamento',
  openDetail: 'Ver detalhe',
  mvpNote:
    'Nesta fase activa acompanhamentos sobre patrimónios activos. Visitas, propostas e Academia virão depois.',
  fields: {
    purpose: 'Finalidade',
    province: 'Província',
    city: 'Cidade',
    type: 'Tipo',
    address: 'Morada',
    code: 'Código',
    notes: 'Notas (opcional)',
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
