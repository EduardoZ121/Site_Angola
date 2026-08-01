export const patrimoniosCopyPt = {
  title: 'Patrimónios',
  subtitle: 'Active e acompanhe o seu património na Kuteka — na mesma conta.',
  empty: 'Ainda não activou nenhum património.',
  activate: 'Ativar Património',
  activating: 'A activar…',
  activated: 'Património activado.',
  backToList: 'Voltar aos patrimónios',
  needPartner: 'Para activar património precisa do papel Parceiro Patrimonial na sua conta.',
  activateRole: 'Activar papel Parceiro',
  loadError: 'Não foi possível carregar os patrimónios. Tente novamente.',
  saveError: 'Não foi possível activar o património. Verifique os dados e tente novamente.',
  forbidden: 'Não tem permissão para gerir patrimónios.',
  detailTitle: 'Detalhe do património',
  fields: {
    title: 'Título',
    titlePlaceholder: 'Ex.: Residência na Maianga',
    type: 'Tipo',
    purpose: 'Finalidade',
    province: 'Província',
    city: 'Cidade',
    address: 'Morada (opcional)',
    notes: 'Notas (opcional)',
    status: 'Estado',
    code: 'Código',
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
    draft: 'Rascunho',
    active: 'Activo',
    archived: 'Arquivado',
  },
  listHeading: 'Os seus patrimónios',
  mvpNote:
    'Nesta fase activa o registo do património. Documentos, Passaporte e publicação virão em módulos seguintes.',
} as const;

export function getPatrimoniosCopy() {
  return patrimoniosCopyPt;
}
