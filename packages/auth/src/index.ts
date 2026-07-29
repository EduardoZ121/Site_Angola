import type { PermissionCode, RoleCode } from '@kuteka/types';

/** Initial permission matrix skeleton (FASE 1) — extend via PRDs */
export const ROLE_PERMISSIONS: Record<string, readonly PermissionCode[]> = {
  client: ['platform.access'],
  patrimonial_partner: ['platform.access'],
  certified_agent: ['platform.access'],
  administrator: ['platform.access', 'admin.panel'],
};

export function permissionsForRoles(roles: readonly RoleCode[]): Set<PermissionCode> {
  const set = new Set<PermissionCode>();
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role];
    if (!perms) continue;
    for (const p of perms) set.add(p);
  }
  return set;
}

export function userHasRole(roles: readonly RoleCode[], role: RoleCode): boolean {
  return roles.includes(role);
}

export function userHasPermission(roles: readonly RoleCode[], permission: PermissionCode): boolean {
  return permissionsForRoles(roles).has(permission);
}

export function userHasAnyPermission(
  roles: readonly RoleCode[],
  permissions: readonly PermissionCode[],
): boolean {
  const owned = permissionsForRoles(roles);
  return permissions.some((p) => owned.has(p));
}

export function userHasAllPermissions(
  roles: readonly RoleCode[],
  permissions: readonly PermissionCode[],
): boolean {
  const owned = permissionsForRoles(roles);
  return permissions.every((p) => owned.has(p));
}

/** Session helpers are thin wrappers — wire to Supabase in apps/web */
export interface SessionLike {
  userId: string;
  email: string | null;
  roles: RoleCode[];
}

export function canAccessPlatform(session: SessionLike | null): boolean {
  if (!session) return false;
  return userHasPermission(session.roles, 'platform.access');
}

export function canAccessAdminPanel(session: SessionLike | null): boolean {
  if (!session) return false;
  return userHasPermission(session.roles, 'admin.panel');
}
