/** Shell chrome copy — pt-AO (Fase 3 + UX refresh). */
export const shellCopyPt = {
  areaTitle: 'Plataforma Kuteka',
  navAria: 'Navegação da plataforma',
  openMenu: 'Abrir menu',
  closeMenu: 'Fechar menu',
  soon: 'Em breve',
  userMenuAria: 'Menu da conta',
  userMenu: {
    profile: 'Perfil',
    roles: 'Papéis',
    settings: 'Definições',
  },
  items: {
    home: 'Início',
    patrimonios: 'Patrimónios',
    habitacao: 'Habitação',
    confianca: 'Confiança',
    admin: 'Administração',
  },
} as const;

export type ShellCopy = typeof shellCopyPt;

export function getShellCopy(): ShellCopy {
  return shellCopyPt;
}
