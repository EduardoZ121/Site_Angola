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

/**
 * Expected RLS / capability matrix for critical surfaces (regression contract).
 * Mirrors policies in migrations 0004 / 0035 / 0043 / finance phase1 — client-side
 * mirror of DB grants; never a substitute for PostgreSQL RLS.
 */
export const CRITICAL_RLS_MATRIX = {
  properties: {
    selectOwn: true,
    selectOtherAsClient: false,
    selectAsAdmin: true,
  },
  beta_feedback: {
    insertOwnViaRpc: true,
    selectAsClient: false,
    selectAsOps: true, // finance.manage | admin.panel | Founder
  },
  finance: {
    manageAsClient: false,
    manageRequires: 'finance.manage' as PermissionCode,
  },
} as const;

/** properties SELECT: owner or admin.panel (0004 properties_select_own). */
export function canSelectPropertyRow(
  ctx: AuthorizationContext | null | undefined,
  ownerId: string,
): boolean {
  if (!ctx) return false;
  if (ctx.userId === ownerId) return true;
  return userHasPermission(ctx.permissions, 'admin.panel');
}

/** beta_feedback SELECT ops (0035 + 0043): finance.manage | admin.panel. */
export function canSelectBetaFeedback(ctx: AuthorizationContext | null | undefined): boolean {
  if (!ctx) return false;
  return userHasAnyPermission(ctx.permissions, ['finance.manage', 'admin.panel']);
}

/** beta_feedback insert is own-only via RPC; clients without session cannot. */
export function canSubmitBetaFeedback(ctx: AuthorizationContext | null | undefined): boolean {
  if (!ctx) return false;
  return userHasPermission(ctx.permissions, 'platform.access');
}

/** finance.manage deny for plain client. */
export function canManageFinance(ctx: AuthorizationContext | null | undefined): boolean {
  if (!ctx) return false;
  return userHasPermission(ctx.permissions, 'finance.manage');
}

export function emptyAuthorizationContext(
  userId: string,
  email: string | null = null,
): AuthorizationContext {
  return { userId, email, roles: [], permissions: [] };
}

export { resolveSafeNextPath } from './next-path';
