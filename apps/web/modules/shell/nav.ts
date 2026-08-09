/**
 * Platform Shell navigation — gated by effective (experience) permissions.
 */

import type { PermissionCode } from '@kuteka/types';
import type { ExperienceMode, NavGroup } from './role-experience';

export type ShellNavStatus = 'active' | 'soon';

export type ShellNavLabelKey =
  | 'home'
  | 'explorar'
  | 'residencia'
  | 'favoritos'
  | 'visitas'
  | 'futuro'
  | 'propostas'
  | 'patrimonios'
  | 'ativar'
  | 'habitacao'
  | 'agente'
  | 'mensagens'
  | 'confianca'
  | 'centroConfianca'
  | 'centroSeguranca'
  | 'contratos'
  | 'relatorios'
  | 'conta'
  | 'admin'
  | 'super'
  | 'financeiro'
  | 'mudanca'
  | 'encontrar'
  | 'concierge'
  | 'garantia'
  | 'assistencia'
  | 'servicos'
  | 'planos'
  | 'fundador'
  | 'escalacoes';

export type ShellNavItem = {
  id: string;
  labelKey: ShellNavLabelKey;
  href?: string;
  status: ShellNavStatus;
  /** When set, item is hidden unless the user has this effective permission. */
  requiresPermission?: PermissionCode;
  /** When set, visible if the user has any of these permissions (overrides single check). */
  requiresAnyPermission?: readonly PermissionCode[];
  /** When set, only these experience modes see the item. */
  experiences?: readonly ExperienceMode[];
  group: NavGroup;
};

export const SHELL_NAV_ITEMS: readonly ShellNavItem[] = [
  {
    id: 'home',
    labelKey: 'home',
    href: '/app',
    status: 'active',
    group: 'geral',
  },
  {
    id: 'mensagens',
    labelKey: 'mensagens',
    href: '/app/mensagens',
    status: 'active',
    experiences: [
      'client',
      'client_partner',
      'patrimonial_partner',
      'certified_agent',
      'supervisor',
      'administrator',
      'super_administrator',
      'service_provider',
      'founder',
    ],
    group: 'geral',
  },
  // ── Cliente ──────────────────────────────────────────────────────────────
  {
    id: 'explorar',
    labelKey: 'explorar',
    href: '/app/habitacao/explorar',
    status: 'active',
    requiresPermission: 'housing.explore',
    experiences: ['client', 'client_partner', 'certified_agent'],
    group: 'cliente',
  },
  {
    id: 'residencia',
    labelKey: 'residencia',
    href: '/app/habitacao?vista=residencia',
    status: 'active',
    requiresPermission: 'housing.explore',
    experiences: ['client', 'client_partner'],
    group: 'cliente',
  },
  {
    id: 'favoritos',
    labelKey: 'favoritos',
    href: '/app/habitacao?vista=interesses',
    status: 'active',
    requiresPermission: 'housing.explore',
    experiences: ['client', 'client_partner'],
    group: 'cliente',
  },
  {
    id: 'visitas',
    labelKey: 'visitas',
    href: '/app/habitacao?vista=visitas',
    status: 'active',
    requiresPermission: 'housing.explore',
    experiences: ['client', 'client_partner'],
    group: 'cliente',
  },
  {
    id: 'futuro',
    labelKey: 'futuro',
    href: '/app/habitacao/explorar?disponibilidade=futura',
    status: 'active',
    requiresPermission: 'housing.explore',
    experiences: ['client', 'client_partner', 'certified_agent'],
    group: 'geral',
  },
  {
    id: 'propostas',
    labelKey: 'propostas',
    href: '/app/contratos',
    status: 'active',
    requiresPermission: 'contracts.manage',
    experiences: ['client', 'client_partner'],
    group: 'cliente',
  },
  // ── Parceiro ─────────────────────────────────────────────────────────────
  {
    id: 'patrimonios',
    labelKey: 'patrimonios',
    href: '/app/patrimonios',
    status: 'active',
    requiresPermission: 'properties.manage',
    experiences: ['patrimonial_partner', 'client_partner'],
    group: 'parceiro',
  },
  {
    id: 'ativar',
    labelKey: 'ativar',
    href: '/app/patrimonios/novo',
    status: 'active',
    requiresPermission: 'properties.manage',
    experiences: ['patrimonial_partner', 'client_partner'],
    group: 'parceiro',
  },
  {
    id: 'relatorios',
    labelKey: 'relatorios',
    href: '/app',
    status: 'active',
    requiresPermission: 'properties.manage',
    experiences: ['patrimonial_partner', 'client_partner'],
    group: 'parceiro',
  },
  // ── Shared / ops ─────────────────────────────────────────────────────────
  {
    id: 'contratos',
    labelKey: 'contratos',
    href: '/app/contratos',
    status: 'active',
    requiresPermission: 'contracts.manage',
    experiences: [
      'client',
      'patrimonial_partner',
      'client_partner',
      'certified_agent',
      'administrator',
      'super_administrator',
      'supervisor',
      'service_provider',
      'founder',
    ],
    group: 'geral',
  },
  {
    id: 'confianca',
    labelKey: 'confianca',
    href: '/app/confianca',
    status: 'active',
    requiresPermission: 'trust.manage',
    experiences: [
      'client',
      'patrimonial_partner',
      'client_partner',
      'certified_agent',
      'administrator',
      'super_administrator',
      'supervisor',
      'founder',
    ],
    group: 'geral',
  },
  {
    id: 'centroConfianca',
    labelKey: 'centroConfianca',
    href: '/app/centro-confianca',
    status: 'active',
    experiences: [
      'client',
      'patrimonial_partner',
      'client_partner',
      'certified_agent',
      'administrator',
      'super_administrator',
      'supervisor',
      'service_provider',
      'founder',
    ],
    group: 'geral',
  },
  {
    id: 'centroSeguranca',
    labelKey: 'centroSeguranca',
    href: '/app/centro-seguranca',
    status: 'active',
    experiences: [
      'client',
      'patrimonial_partner',
      'client_partner',
      'certified_agent',
      'administrator',
      'super_administrator',
      'supervisor',
      'service_provider',
      'founder',
    ],
    group: 'geral',
  },
  {
    id: 'agente',
    labelKey: 'agente',
    href: '/app/agente',
    status: 'active',
    requiresPermission: 'agent.operate',
    experiences: [
      'certified_agent',
      'administrator',
      'super_administrator',
      'supervisor',
      'founder',
    ],
    group: 'agente',
  },
  {
    id: 'admin',
    labelKey: 'admin',
    href: '/app/admin',
    status: 'active',
    requiresAnyPermission: ['admin.panel', 'properties.review'],
    experiences: ['supervisor', 'administrator', 'super_administrator', 'founder'],
    group: 'admin',
  },
  {
    id: 'super',
    labelKey: 'super',
    href: '/app/super',
    status: 'active',
    requiresPermission: 'finance.manage',
    experiences: ['super_administrator', 'founder'],
    group: 'admin',
  },
  {
    id: 'financeiro',
    labelKey: 'financeiro',
    href: '/app/financeiro',
    status: 'active',
    experiences: [
      'client',
      'patrimonial_partner',
      'client_partner',
      'certified_agent',
      'administrator',
      'super_administrator',
      'supervisor',
      'service_provider',
      'founder',
    ],
    group: 'geral',
  },
  {
    id: 'mudanca',
    labelKey: 'mudanca',
    href: '/app/mudanca',
    status: 'active',
    experiences: ['client', 'client_partner'],
    group: 'cliente',
  },
  {
    id: 'encontrar',
    labelKey: 'encontrar',
    href: '/app/encontrar-casa',
    status: 'active',
    experiences: ['client', 'client_partner'],
    group: 'cliente',
  },
  {
    id: 'concierge',
    labelKey: 'concierge',
    href: '/app/concierge',
    status: 'active',
    experiences: ['client', 'client_partner', 'certified_agent'],
    group: 'geral',
  },
  {
    id: 'garantia',
    labelKey: 'garantia',
    href: '/app/garantia',
    status: 'active',
    experiences: ['client', 'patrimonial_partner', 'client_partner'],
    group: 'geral',
  },
  {
    id: 'assistencia',
    labelKey: 'assistencia',
    href: '/app/assistencia',
    status: 'active',
    experiences: ['client', 'client_partner', 'certified_agent'],
    group: 'geral',
  },
  {
    id: 'servicos',
    labelKey: 'servicos',
    href: '/app/servicos',
    status: 'active',
    experiences: [
      'client',
      'client_partner',
      'patrimonial_partner',
      'founder',
      'certified_agent',
      'administrator',
      'super_administrator',
      'supervisor',
    ],
    group: 'geral',
  },
  {
    id: 'planos',
    labelKey: 'planos',
    href: '/app/parceiro/planos',
    status: 'active',
    requiresPermission: 'properties.manage',
    experiences: ['patrimonial_partner', 'client_partner'],
    group: 'parceiro',
  },
  {
    id: 'servicosPrestador',
    labelKey: 'servicos',
    href: '/app/servicos',
    status: 'active',
    experiences: ['service_provider'],
    group: 'prestador',
  },
  {
    id: 'fundador',
    labelKey: 'fundador',
    href: '/app/fundador',
    status: 'active',
    experiences: ['founder'],
    group: 'admin',
  },
  {
    id: 'escalacoes',
    labelKey: 'escalacoes',
    href: '/app/admin#escalacoes',
    status: 'active',
    requiresAnyPermission: ['admin.panel', 'properties.review'],
    experiences: ['supervisor', 'administrator', 'super_administrator', 'founder'],
    group: 'admin',
  },
  {
    id: 'conta',
    labelKey: 'conta',
    href: '/app/perfil',
    status: 'active',
    group: 'geral',
  },
] as const;

/** @deprecated — kept for PreferencesForm deep links */
export const LEGACY_HABITACAO = {
  id: 'habitacao',
  labelKey: 'habitacao' as const,
  href: '/app/habitacao',
  status: 'active' as const,
  requiresPermission: 'housing.explore' as const,
  group: 'cliente' as const,
};

export function isNavItemVisible(
  item: ShellNavItem,
  permissions: readonly string[],
  mode?: ExperienceMode,
): boolean {
  if (item.requiresAnyPermission?.length) {
    if (!item.requiresAnyPermission.some((p) => permissions.includes(p))) return false;
  } else if (item.requiresPermission && !permissions.includes(item.requiresPermission)) {
    return false;
  }
  if (mode && item.experiences && !item.experiences.includes(mode)) {
    return false;
  }
  return true;
}

export function isNavItemActive(item: ShellNavItem, pathname: string): boolean {
  if (item.status !== 'active' || !item.href) return false;
  const hrefPath = item.href.split('?')[0]!;
  if (hrefPath === '/app') {
    return pathname === '/app' || pathname === '/app/';
  }
  return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
}

export function visibleNavItems(
  permissions: readonly string[],
  mode: ExperienceMode,
): ShellNavItem[] {
  return SHELL_NAV_ITEMS.filter((item) => isNavItemVisible(item, permissions, mode));
}

export function groupNavItems(items: readonly ShellNavItem[]): {
  group: NavGroup;
  items: ShellNavItem[];
}[] {
  const order: NavGroup[] = ['geral', 'cliente', 'parceiro', 'agente', 'prestador', 'admin'];
  const map = new Map<NavGroup, ShellNavItem[]>();
  for (const item of items) {
    const list = map.get(item.group) ?? [];
    list.push(item);
    map.set(item.group, list);
  }
  return order
    .filter((g) => (map.get(g)?.length ?? 0) > 0)
    .map((group) => ({ group, items: map.get(group)! }));
}
