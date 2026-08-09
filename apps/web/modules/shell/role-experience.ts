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
  | 'service_provider'
  | 'supervisor'
  | 'administrator'
  | 'super_administrator'
  | 'founder';

export type NavGroup = 'geral' | 'cliente' | 'parceiro' | 'agente' | 'prestador' | 'admin';

export const EXPERIENCE_STORAGE_KEY = 'kuteka-active-experience';

export const EXPERIENCE_LABELS: Record<ExperienceMode, string> = {
  client: 'Cliente',
  patrimonial_partner: 'Parceiro Patrimonial',
  client_partner: 'Cliente + Parceiro',
  certified_agent: 'Agente Certificado',
  service_provider: 'Prestador',
  supervisor: 'Supervisor',
  administrator: 'Administrador',
  super_administrator: 'Superadministrador',
  founder: 'Founder / Owner',
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
  service_provider: ['platform.access', 'services.operate', 'contracts.manage', 'trust.manage'],
  supervisor: [
    'platform.access',
    'admin.panel',
    'properties.review',
    'audit.read',
    'moderation.manage',
    'housing.explore',
    'trust.manage',
    'contracts.manage',
    'agent.operate',
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
    'agent.operate',
    'reputation.manage',
    'finance.manage',
    'finance.read',
  ],
  founder: [
    'platform.access',
    'admin.panel',
    'properties.review',
    'audit.read',
    'moderation.manage',
    'executive.panel',
    'founder.manage',
    'trust.manage',
    'contracts.manage',
    'housing.explore',
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
  if (set.has('service_provider')) modes.push('service_provider');
  if (set.has('supervisor')) modes.push('supervisor');
  if (set.has('administrator')) modes.push('administrator');
  if (set.has('super_administrator')) modes.push('super_administrator');
  if (set.has('founder') || set.has('co_founder')) modes.push('founder');

  return modes;
}

export function defaultExperience(roles: readonly string[]): ExperienceMode {
  const available = availableExperiences(roles);
  // Prefer institutional / ops modes over client when both exist
  if (available.includes('founder')) return 'founder';
  if (available.includes('super_administrator')) return 'super_administrator';
  if (available.includes('administrator')) return 'administrator';
  if (available.includes('supervisor')) return 'supervisor';
  if (available.includes('certified_agent')) return 'certified_agent';
  if (available.includes('service_provider')) return 'service_provider';
  if (available.includes('client_partner')) return 'client_partner';
  if (available.includes('patrimonial_partner')) return 'patrimonial_partner';
  if (available.includes('client')) return 'client';
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
  permissions: readonly string[];
};

const PATH_RULES: PathRule[] = [
  { prefix: '/app/patrimonios', permissions: ['properties.manage'] },
  { prefix: '/app/habitacao', permissions: ['housing.explore'] },
  { prefix: '/app/agente', permissions: ['agent.operate'] },
  { prefix: '/app/admin', permissions: ['admin.panel', 'properties.review'] },
  { prefix: '/app/confianca', permissions: ['trust.manage'] },
  { prefix: '/app/contratos', permissions: ['contracts.manage'] },
  { prefix: '/app/super', permissions: ['finance.manage', 'founder.manage'] },
  { prefix: '/app/servicos', permissions: ['services.operate', 'platform.access'] },
  // /app/fundador is open to any signed-in account (bootstrap) — no PATH_RULE.
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
    case 'service_provider':
      return '/app/servicos';
    case 'supervisor':
    case 'administrator':
      return '/app/admin';
    case 'super_administrator':
      return '/app/super';
    case 'founder':
      return '/app/fundador';
    default:
      return '/app';
  }
}
