import {
  fetchAuthorizationContext,
  writeAuditLog,
  type WriteAuditLogInput,
} from '@kuteka/database';
import type { AuthorizationContext } from '@kuteka/auth';
import { createServerClient } from '@/lib/supabase/client';

/**
 * Server-side authorization context from PostgreSQL (official RBAC source).
 * Requires Supabase env + migration 0002.
 */
export async function getAuthorizationContext(
  userId: string,
  email: string | null = null,
): Promise<AuthorizationContext> {
  const client = await createServerClient();
  return fetchAuthorizationContext(client, userId, email);
}

export async function recordAuditEvent(input: WriteAuditLogInput): Promise<string> {
  const client = await createServerClient();
  return writeAuditLog(client, input);
}
