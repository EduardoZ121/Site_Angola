/** Shell chrome copy — pt-AO (Fase 3 + role experience). */
export const shellCopyPt = {
  areaTitle: 'Plataforma Kuteka',
  navAria: 'Navegação da plataforma',
  openMenu: 'Abrir menu',
  closeMenu: 'Fechar menu',
  soon: 'Em breve',
  notificationsSoon: 'Notificações — em breve',
  userMenuAria: 'Menu da conta',
  switchRole: 'Mudar de papel',
  switchRoleHint: 'Altera menus, dashboard e fluxos imediatamente',
  activeExperience: 'Experiência activa',
  groups: {
    geral: 'Geral',
    cliente: 'Cliente',
    parceiro: 'Parceiro Patrimonial',
    agente: 'Agente',
    admin: 'Administração',
  },
  userMenu: {
    profile: 'Perfil',
    profileHint: 'Os meus dados pessoais',
    roles: 'Os meus papéis',
    rolesHint: 'Activar ou gerir papéis da conta',
    patrimonios: 'Os meus patrimónios',
    patrimoniosHint: 'Anúncios e gestão patrimonial',
    contracts: 'Contratos',
    contractsHint: 'Minutas e formalizações',
    documents: 'Documentos',
    documentsHint: 'Confiança e verificação',
    settings: 'Definições',
    settingsHint: 'Preferências da conta',
    help: 'Centro de ajuda',
    helpHint: 'Guias e perguntas frequentes',
    contact: 'Contactar Kuteka',
    contactHint: 'Fale com a nossa equipa',
    logout: 'Terminar sessão',
  },

  items: {
    home: 'Início',
    explorar: 'Explorar Habitação',
    favoritos: 'Favoritos / Interesses',
    visitas: 'Visitas',
    propostas: 'Propostas',
    patrimonios: 'Patrimónios',
    ativar: 'Ativar Património',
    habitacao: 'Habitação',
    agente: 'Agente',
    confianca: 'Confiança',
    contratos: 'Contratos',
    relatorios: 'Relatórios',
    conta: 'Conta',
    admin: 'Administração',
  },

  routeBlocked: {
    title: 'Área indisponível neste papel',
    body: 'A experiência activa não inclui este fluxo. Mude de papel no menu da conta ou escolha um atalho autorizado.',
    switch: 'Mudar de papel',
    home: 'Ir ao início',
  },
} as const;

export type ShellCopy = typeof shellCopyPt;

export function getShellCopy(): ShellCopy {
  return shellCopyPt;
}
