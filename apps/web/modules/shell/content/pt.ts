/** Shell chrome copy — pt-AO (Fase 3). */
export const shellCopyPt = {
  areaTitle: 'O seu espaço',
  navAria: 'Navegação da plataforma',
  openMenu: 'Abrir menu',
  closeMenu: 'Fechar menu',
  soon: 'Em breve',
  items: {
    home: 'Início',
    patrimonios: 'Patrimónios',
    confianca: 'Confiança',
    habitacao: 'Habitação',
    admin: 'Administração',
  },
} as const;

export type ShellCopy = typeof shellCopyPt;

export function getShellCopy(): ShellCopy {
  return shellCopyPt;
}
