/** Mensagens — Chat Kuteka MVP (Sprint Beta 1.5) — pt-AO. */
export const mensagensCopyPt = {
  title: 'Mensagens',
  subtitle: 'Converse com Clientes, Parceiros, Agentes e Prestadores sem sair da Kuteka.',
  inboxTitle: 'Caixa de entrada',
  searchPlaceholder: 'Procurar por pessoa ou conversa…',
  emptyTitle: 'Ainda sem conversas',
  empty:
    'Quando iniciar uma conversa com um Cliente, Parceiro, Agente ou Prestador, ela aparece aqui.',
  emptyFiltered: 'Nenhuma conversa corresponde à pesquisa ou ao filtro seleccionado.',
  loadError: 'Estamos a ter dificuldade em mostrar as suas mensagens. Tente novamente.',
  threadLoadError: 'Não foi possível abrir esta conversa. Tente novamente.',
  sendError: 'Não foi possível enviar a mensagem. Tente novamente.',
  startError: 'Não foi possível iniciar esta conversa.',
  statusChangeError: 'Não foi possível actualizar o estado da conversa.',
  selectConversation: 'Seleccione uma conversa para ver as mensagens.',
  composerPlaceholder: 'Escreva uma mensagem…',
  send: 'Enviar',
  sending: 'A enviar…',
  backToList: 'Voltar às conversas',
  statuses: {
    active: 'Activa',
    archived: 'Arquivada',
    completed: 'Concluída',
  },
  statusFilters: {
    all: 'Todas',
    active: 'Activas',
    archived: 'Arquivadas',
    completed: 'Concluídas',
  },
  markRead: 'Marcar como lida',
  archive: 'Arquivar',
  reopen: 'Reactivar',
  complete: 'Marcar concluída',
  unreadBadgeAria: 'mensagens por ler',
  topbar: {
    title: 'Mensagens',
    empty: 'Sem mensagens novas neste momento.',
    loading: 'A carregar conversas…',
    viewAll: 'Ver todas',
    loadError: 'Não foi possível carregar as conversas recentes.',
  },
  contactPolicy: {
    title: 'Porque não vejo telefone ou email?',
    body: 'Por segurança de ambas as partes, o telefone e o email só são partilhados depois de existir um contrato activo/concluído, uma visita agendada, ou uma autorização explícita da Kuteka. Até lá, combine tudo pelo Chat Kuteka.',
    shareLocked: 'Os contactos ainda não foram libertados para esta conversa.',
    shareUnlocked: 'Contrato formalizado — os contactos já podem ser partilhados nesta conversa.',
  },
  contextLabels: {
    property: 'Património',
    contract: 'Contrato',
    service: 'Serviço',
    general: 'Geral',
    admin: 'Administração',
    interest: 'Interesse',
  },
  roleLabels: {
    client: 'Cliente',
    partner: 'Parceiro',
    agent: 'Agente',
    provider: 'Prestador',
    admin: 'Administração',
    superadmin: 'Super Admin',
    other: 'Utilizador Kuteka',
  },
  cta: {
    messageOwner: 'Mensagem',
    messageBusy: 'A abrir conversa…',
    messageSent: 'Conversa iniciada — abra Mensagens para continuar.',
    messageSelf: 'Este património é seu — não é possível enviar uma mensagem a si próprio.',
    notAllowed: 'Não é possível iniciar esta conversa a partir do seu papel actual.',
    openInbox: 'Abrir Mensagens',
  },
  forbidden: 'Inicie sessão para aceder às Mensagens.',
} as const;

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

export type MensagensCopy = DeepStringify<typeof mensagensCopyPt>;
