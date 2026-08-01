/**
 * Platform Shell navigation (Fase 3 · Core v1.0).
 * Product modules are permission-gated; Agente stays visible for demo pipeline.
 */

import type { PermissionCode } from '@kuteka/types';

export type ShellNavStatus = 'active' | 'soon';

export type ShellNavItem = {
  id: string;
  labelKey: 'home' | 'patrimonios' | 'habitacao' | 'agente' | 'confianca' | 'contratos' | 'admin';
  href?: string;
  status: ShellNavStatus;
  /** When set, item is hidden unless the user has this permission. */
  requiresPermission?: PermissionCode;
};

export const SHELL_NAV_ITEMS: readonly ShellNavItem[] = [
  { id: 'home', labelKey: 'home', href: '/app', status: 'active' },
  {
    id: 'patrimonios',
    labelKey: 'patrimonios',
    href: '/app/patrimonios',
    status: 'active',
    requiresPermission: 'properties.manage',
  },
  {
    id: 'habitacao',
    labelKey: 'habitacao',
    href: '/app/habitacao',
    status: 'active',
    requiresPermission: 'housing.explore',
  },
  { id: 'agente', labelKey: 'agente', href: '/app/agente', status: 'active' },
  {
    id: 'confianca',
    labelKey: 'confianca',
    href: '/app/confianca',
    status: 'active',
    requiresPermission: 'trust.manage',
  },
  {
    id: 'contratos',
    labelKey: 'contratos',
    href: '/app/contratos',
    status: 'active',
    requiresPermission: 'contracts.manage',
  },
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
