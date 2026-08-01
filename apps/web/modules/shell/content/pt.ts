/** Shell chrome copy — pt-AO (Fase 3 + UX refresh). */
export const shellCopyPt = {
  areaTitle: 'Plataforma Kuteka',
  navAria: 'Navegação da plataforma',
  openMenu: 'Abrir menu',
  closeMenu: 'Fechar menu',
  soon: 'Em breve',
  notificationsSoon: 'Notificações — em breve',
  userMenuAria: 'Menu da conta',
  userMenu: {
    profile: 'Perfil',
    profileHint: 'Os meus dados pessoais',
    roles: 'Os meus papéis',
    rolesHint: 'Cliente, Parceiro, Agente…',
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
    patrimonios: 'Patrimónios',
    habitacao: 'Habitação',
    agente: 'Agente',
    confianca: 'Confiança',
    contratos: 'Contratos',
    admin: 'Administração',
  },
} as const;

export type ShellCopy = typeof shellCopyPt;

export function getShellCopy(): ShellCopy {
  return shellCopyPt;
}
