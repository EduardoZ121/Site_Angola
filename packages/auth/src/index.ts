import type { PermissionCode, RoleCode } from '@kuteka/types';

/**
 * Authorization context resolved from the official source (PostgreSQL).
 * Never invent permissions in the client — load via get_user_* RPCs / queries.
 */
export interface AuthorizationContext {
  userId: string;
  email: string | null;
  roles: RoleCode[];
  permissions: PermissionCode[];
}

/** @deprecated Use AuthorizationContext — kept as alias during P0 transition */
export type SessionLike = AuthorizationContext;

export function userHasRole(roles: readonly RoleCode[], role: RoleCode): boolean {
  return roles.includes(role);
}

export function userHasPermission(
  permissions: readonly PermissionCode[],
  permission: PermissionCode,
): boolean {
  return permissions.includes(permission);
}

export function userHasAnyPermission(
  owned: readonly PermissionCode[],
  required: readonly PermissionCode[],
): boolean {
  return required.some((p) => owned.includes(p));
}

export function userHasAllPermissions(
  owned: readonly PermissionCode[],
  required: readonly PermissionCode[],
): boolean {
  return required.every((p) => owned.includes(p));
}

export function canAccessPlatform(ctx: AuthorizationContext | null | undefined): boolean {
  if (!ctx) return false;
  return userHasPermission(ctx.permissions, 'platform.access');
}

export function canAccessAdminPanel(ctx: AuthorizationContext | null | undefined): boolean {
  if (!ctx) return false;
  return userHasPermission(ctx.permissions, 'admin.panel');
}

export function emptyAuthorizationContext(
  userId: string,
  email: string | null = null,
): AuthorizationContext {
  return { userId, email, roles: [], permissions: [] };
}

export { resolveSafeNextPath } from './next-path';
