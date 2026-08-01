/**
 * Experience lens — Manual Operacional: papéis governam menus, dashboards e fluxos.
 * UI permissions = intersection(real session permissions, mode lens).
 * RLS no servidor continua a usar as permissões reais da conta.
 */

export type ExperienceMode =
  | 'client'
  | 'patrimonial_partner'
  | 'client_partner'
  | 'certified_agent'
  | 'administrator'
  | 'super_administrator';

export type NavGroup = 'geral' | 'cliente' | 'parceiro' | 'agente' | 'admin';

export const EXPERIENCE_STORAGE_KEY = 'kuteka-active-experience';

export const EXPERIENCE_LABELS: Record<ExperienceMode, string> = {
  client: 'Cliente',
  patrimonial_partner: 'Parceiro Patrimonial',
  client_partner: 'Cliente + Parceiro',
  certified_agent: 'Agente Certificado',
  administrator: 'Administrador',
  super_administrator: 'Superadministrador',
};

/** Permissions exposed in the UI for each experience mode. */
const MODE_LENS: Record<ExperienceMode, readonly string[]> = {
  client: ['platform.access', 'housing.explore', 'contracts.manage', 'reputation.manage'],
  patrimonial_partner: [
    'platform.access',
    'properties.manage',
    'contracts.manage',
    'trust.manage',
    'reputation.manage',
  ],
  client_partner: [
    'platform.access',
    'housing.explore',
    'properties.manage',
    'contracts.manage',
    'trust.manage',
    'reputation.manage',
  ],
  certified_agent: [
    'platform.access',
    'agent.operate',
    'housing.explore',
    'contracts.manage',
    'reputation.manage',
  ],
  administrator: [
    'platform.access',
    'admin.panel',
    'trust.manage',
    'contracts.manage',
    'housing.explore',
    'properties.manage',
    'agent.operate',
    'reputation.manage',
  ],
  super_administrator: [
    'platform.access',
    'admin.panel',
    'executive.panel',
    'trust.manage',
    'contracts.manage',
    'housing.explore',
    'properties.manage',
    'agent.operate',
    'reputation.manage',
  ],
};

export function availableExperiences(roles: readonly string[]): ExperienceMode[] {
  const set = new Set(roles);
  const modes: ExperienceMode[] = [];
  const hasClient = set.has('client');
  const hasPartner = set.has('patrimonial_partner');

  if (hasClient && hasPartner) modes.push('client_partner');
  if (hasClient) modes.push('client');
  if (hasPartner) modes.push('patrimonial_partner');
  if (set.has('certified_agent')) modes.push('certified_agent');
  if (set.has('administrator')) modes.push('administrator');
  if (set.has('super_administrator')) modes.push('super_administrator');

  return modes;
}

export function defaultExperience(roles: readonly string[]): ExperienceMode {
  const available = availableExperiences(roles);
  if (available.includes('client_partner')) return 'client_partner';
  if (available.includes('patrimonial_partner')) return 'patrimonial_partner';
  if (available.includes('client')) return 'client';
  if (available.includes('certified_agent')) return 'certified_agent';
  if (available.includes('super_administrator')) return 'super_administrator';
  if (available.includes('administrator')) return 'administrator';
  return 'client';
}

export function resolveExperience(
  roles: readonly string[],
  preferred: string | null | undefined,
): ExperienceMode {
  const available = availableExperiences(roles);
  if (preferred && available.includes(preferred as ExperienceMode)) {
    return preferred as ExperienceMode;
  }
  return defaultExperience(roles);
}

/**
 * Effective UI permissions for the active experience.
 * Always capped by real session permissions (cannot escalate).
 */
export function permissionsForExperience(
  mode: ExperienceMode,
  realPermissions: readonly string[],
): string[] {
  const lens = new Set(MODE_LENS[mode]);
  return realPermissions.filter((p) => lens.has(p));
}

export function hasEffectivePermission(effective: readonly string[], permission: string): boolean {
  return effective.includes(permission);
}

type PathRule = {
  prefix: string;
  permission: string;
};

const PATH_RULES: PathRule[] = [
  { prefix: '/app/patrimonios', permission: 'properties.manage' },
  { prefix: '/app/habitacao', permission: 'housing.explore' },
  { prefix: '/app/agente', permission: 'agent.operate' },
  { prefix: '/app/admin', permission: 'admin.panel' },
  { prefix: '/app/confianca', permission: 'trust.manage' },
  { prefix: '/app/contratos', permission: 'contracts.manage' },
];

export function canAccessPath(
  pathname: string,
  effectivePermissions: readonly string[],
): { ok: true } | { ok: false; permission: string; prefix: string } {
  const path = pathname.split('?')[0] || pathname;
  for (const rule of PATH_RULES) {
    if (path === rule.prefix || path.startsWith(`${rule.prefix}/`)) {
      if (!effectivePermissions.includes(rule.permission)) {
        return { ok: false, permission: rule.permission, prefix: rule.prefix };
      }
    }
  }
  return { ok: true };
}

export function homePathForExperience(mode: ExperienceMode): string {
  switch (mode) {
    case 'client':
      return '/app/habitacao/explorar';
    case 'patrimonial_partner':
      return '/app/patrimonios';
    case 'certified_agent':
      return '/app/agente';
    case 'administrator':
    case 'super_administrator':
      return '/app/admin';
    default:
      return '/app';
  }
}
