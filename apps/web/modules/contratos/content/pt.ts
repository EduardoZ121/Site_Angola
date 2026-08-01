export const contratosCopyPt = {
  title: 'Contratos',
  subtitle:
    'Formalize a intenção aprovada em contrato, com partes, valor, termos e estados claros.',
  create: 'Preparar contrato',
  createTitle: 'Preparar novo contrato',
  createHint:
    'Escolha um património activo, identifique o Cliente e registe a minuta antes do pagamento.',
  creating: 'A preparar…',
  created: 'Contrato preparado para aceitação.',
  detailTitle: 'Detalhe do contrato',
  demoNote: 'Dados demo: contratos ligados ao inventário KTK-DEMO para mostrar a operação em uso.',
  emptyTitle: 'Sem contratos ainda',
  empty:
    'Quando Confiança e Administração validarem as partes, prepare o primeiro contrato para seguir para Pagamentos.',
  emptyDemo:
    'Se a base estiver vazia, execute a migration PRD-008 para carregar contratos demo KTK-CTR.',
  loadError: 'Não foi possível carregar Contratos. Tente novamente.',
  saveError: 'Não foi possível preparar o contrato. Verifique os dados e tente novamente.',
  transitionError: 'Não foi possível actualizar o contrato. Tente novamente.',
  forbidden:
    'A área Contratos fica disponível quando a sua conta tem o papel adequado (Cliente, Parceiro, Agente ou Admin).',
  accept: 'Aceitar contrato',
  accepting: 'A aceitar…',
  accepted: 'Contrato activo. O próximo passo é preparar pagamento.',
  cancel: 'Cancelar contrato',
  cancelling: 'A cancelar…',
  cancelled: 'Contrato cancelado.',
  complete: 'Marcar concluído',
  completing: 'A concluir…',
  completed: 'Contrato concluído.',
  openDetail: 'Abrir contrato',
  preparePayment: 'Preparar pagamento',
  paymentsSoon: 'Pagamentos em expansão — por agora acompanhe pelo painel.',
  fields: {
    code: 'Código',
    property: 'Património',
    propertyId: 'ID do património',
    clientId: 'ID do Cliente',
    agentId: 'ID do Agente (opcional)',
    interestId: 'ID do interesse (opcional)',
    purpose: 'Finalidade',
    amount: 'Valor (AOA)',
    title: 'Título',
    titlePlaceholder: 'Ex.: Contrato de arrendamento — Apartamento T3 Kilamba',
    terms: 'Termos e notas',
    termsPlaceholder: 'Inclua condições essenciais, prazos e responsabilidades.',
    status: 'Estado',
    createdAt: 'Criado',
    updatedAt: 'Actualizado',
    parties: 'Partes',
    partner: 'Parceiro',
    client: 'Cliente',
    agent: 'Agente',
    payment: 'Pagamento',
  },
  purposes: {
    rent: 'Arrendamento',
    sale: 'Venda',
  },
  statuses: {
    draft: 'Rascunho',
    pending_acceptance: 'Pendente de aceitação',
    active: 'Activo',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  },
} as const;

export function getContratosCopy() {
  return contratosCopyPt;
}
