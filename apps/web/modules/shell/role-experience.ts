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
  | 'supervisor'
  | 'administrator'
  | 'super_administrator';

export type NavGroup = 'geral' | 'cliente' | 'parceiro' | 'agente' | 'admin';

export const EXPERIENCE_STORAGE_KEY = 'kuteka-active-experience';

export const EXPERIENCE_LABELS: Record<ExperienceMode, string> = {
  client: 'Cliente',
  patrimonial_partner: 'Parceiro Patrimonial',
  client_partner: 'Cliente + Parceiro',
  certified_agent: 'Agente Certificado',
  supervisor: 'Supervisor',
  administrator: 'Administrador',
  super_administrator: 'Superadministrador',
};

/** Permissions exposed in the UI for each experience mode. */
const MODE_LENS: Record<ExperienceMode, readonly string[]> = {
  client: [
    'platform.access',
    'housing.explore',
    'contracts.manage',
    'reputation.manage',
    'trust.manage',
  ],
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
    'trust.manage',
  ],
  supervisor: [
    'platform.access',
    'admin.panel',
    'properties.review',
    'audit.read',
    'moderation.manage',
    'housing.explore',
    'trust.manage',
    'contracts.manage',
  ],
  administrator: [
    'platform.access',
    'admin.panel',
    'properties.review',
    'audit.read',
    'moderation.manage',
    'trust.manage',
    'contracts.manage',
    'housing.explore',
    'properties.manage',
    'agent.operate',
    'reputation.manage',
    'finance.read',
  ],
  super_administrator: [
    'platform.access',
    'admin.panel',
    'properties.review',
    'audit.read',
    'moderation.manage',
    'executive.panel',
    'trust.manage',
    'contracts.manage',
    'housing.explore',
    'properties.manage',
    'agent.operate',
    'reputation.manage',
    'finance.manage',
    'finance.read',
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
  if (set.has('supervisor')) modes.push('supervisor');
  if (set.has('administrator')) modes.push('administrator');
  if (set.has('super_administrator') || set.has('co_founder') || set.has('founder')) {
    modes.push('super_administrator');
  }

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
  if (available.includes('supervisor')) return 'supervisor';
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
  /** Any of these effective permissions grants access. */
  permissions: readonly string[];
};

const PATH_RULES: PathRule[] = [
  { prefix: '/app/patrimonios', permissions: ['properties.manage'] },
  { prefix: '/app/habitacao', permissions: ['housing.explore'] },
  { prefix: '/app/agente', permissions: ['agent.operate'] },
  { prefix: '/app/admin', permissions: ['admin.panel', 'properties.review'] },
  { prefix: '/app/confianca', permissions: ['trust.manage'] },
  { prefix: '/app/contratos', permissions: ['contracts.manage'] },
  { prefix: '/app/super', permissions: ['finance.manage'] },
  // /app/fundador — open to any authenticated user (bootstrap chicken-egg)
];

export function canAccessPath(
  pathname: string,
  effectivePermissions: readonly string[],
): { ok: true } | { ok: false; permission: string; prefix: string } {
  const path = pathname.split('?')[0] || pathname;
  for (const rule of PATH_RULES) {
    if (path === rule.prefix || path.startsWith(`${rule.prefix}/`)) {
      const ok = rule.permissions.some((p) => effectivePermissions.includes(p));
      if (!ok) {
        return { ok: false, permission: rule.permissions[0]!, prefix: rule.prefix };
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
    case 'supervisor':
    case 'administrator':
      return '/app/admin';
    case 'super_administrator':
      return '/app/super';
    default:
      return '/app';
  }
}
