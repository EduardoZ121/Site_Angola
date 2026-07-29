import type { AuthorizationContext } from '@kuteka/auth';
import type { PermissionCode, RoleCode } from '@kuteka/types';
import type { KutekaSupabaseClient } from './index';

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

/**
 * Load roles + permissions for a user from PostgreSQL (official RBAC source).
 * Requires migration 0002 RPCs.
 */
export async function fetchAuthorizationContext(
  client: KutekaSupabaseClient,
  userId: string,
  email: string | null = null,
): Promise<AuthorizationContext> {
  const [rolesResult, permissionsResult] = await Promise.all([
    client.rpc('get_user_role_codes', { p_user_id: userId }),
    client.rpc('get_user_permission_codes', { p_user_id: userId }),
  ]);

  if (rolesResult.error) {
    throw new Error(`Failed to load roles: ${rolesResult.error.message}`);
  }
  if (permissionsResult.error) {
    throw new Error(`Failed to load permissions: ${permissionsResult.error.message}`);
  }

  return {
    userId,
    email,
    roles: asStringArray(rolesResult.data) as RoleCode[],
    permissions: asStringArray(permissionsResult.data) as PermissionCode[],
  };
}

export interface WriteAuditLogInput {
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Controlled audit write via security definer RPC (P0-2).
 * Do not insert into audit_logs from the client directly.
 */
export async function writeAuditLog(
  client: KutekaSupabaseClient,
  input: WriteAuditLogInput,
): Promise<string> {
  const { data, error } = await client.rpc('write_audit_log', {
    p_action: input.action,
    p_entity_type: input.entityType ?? null,
    p_entity_id: input.entityId ?? null,
    p_metadata: input.metadata ?? null,
  });

  if (error) {
    throw new Error(`Failed to write audit log: ${error.message}`);
  }
  if (typeof data !== 'string') {
    throw new Error('write_audit_log returned unexpected payload');
  }
  return data;
}
