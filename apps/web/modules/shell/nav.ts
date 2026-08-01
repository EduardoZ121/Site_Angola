/**
 * Platform Shell navigation (Fase 3 · D3–D5).
 * Single nav for all roles; availability is active | soon | permission-gated.
 */

export type ShellNavStatus = 'active' | 'soon';

export type ShellNavItem = {
  id: string;
  labelKey: 'home' | 'patrimonios' | 'habitacao' | 'agente' | 'confianca' | 'admin';
  href?: string;
  status: ShellNavStatus;
  /** When set, item is hidden unless the user has this permission. */
  requiresPermission?: 'admin.panel';
};

export const SHELL_NAV_ITEMS: readonly ShellNavItem[] = [
  { id: 'home', labelKey: 'home', href: '/app', status: 'active' },
  { id: 'patrimonios', labelKey: 'patrimonios', href: '/app/patrimonios', status: 'active' },
  { id: 'habitacao', labelKey: 'habitacao', href: '/app/habitacao', status: 'active' },
  { id: 'agente', labelKey: 'agente', href: '/app/agente', status: 'active' },
  { id: 'confianca', labelKey: 'confianca', status: 'soon' },
  {
    id: 'admin',
    labelKey: 'admin',
    href: '/app/admin',
    status: 'active',
    requiresPermission: 'admin.panel',
  },
] as const;

export function isNavItemVisible(item: ShellNavItem, permissions: readonly string[]): boolean {
  if (!item.requiresPermission) return true;
  return permissions.includes(item.requiresPermission);
}

export function isNavItemActive(item: ShellNavItem, pathname: string): boolean {
  if (item.status !== 'active' || !item.href) return false;
  if (item.href === '/app') {
    return pathname === '/app' || pathname === '/app/';
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
