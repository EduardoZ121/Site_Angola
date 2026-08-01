export const habitacaoCopyPt = {
  title: 'Habitação',
  subtitle: 'Defina preferências e explore patrimónios activos na Kuteka.',
  explore: 'Explorar habitação',
  preferencesTitle: 'As suas preferências',
  preferencesHint: 'Usamos estes filtros como ponto de partida na exploração.',
  savePreferences: 'Guardar preferências',
  saving: 'A guardar…',
  saved: 'Preferências guardadas.',
  needClient: 'Para usar Habitação precisa do papel Cliente na sua conta.',
  activateRole: 'Activar papel Cliente',
  loadError: 'Não foi possível carregar a Habitação. Tente novamente.',
  saveError: 'Não foi possível guardar as preferências. Tente novamente.',
  forbidden: 'Não tem permissão para explorar habitação.',
  exploreTitle: 'Explorar habitação',
  exploreSubtitle: 'Patrimónios activos disponibilizados por Parceiros Patrimoniais.',
  empty: 'Ainda não há patrimónios activos para mostrar com estes filtros.',
  backToHub: 'Voltar à Habitação',
  backToExplore: 'Voltar à exploração',
  detailTitle: 'Detalhe da habitação',
  openDetail: 'Ver detalhe',
  mvpNote:
    'Nesta fase explora patrimónios activos e guarda preferências. Visitas, propostas, Passaporte e Confiança virão depois.',
  fields: {
    purpose: 'Finalidade',
    province: 'Província',
    city: 'Cidade',
    type: 'Tipo',
    address: 'Morada',
    code: 'Código',
    any: 'Qualquer',
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
} as const;

export function getHabitacaoCopy() {
  return habitacaoCopyPt;
}
