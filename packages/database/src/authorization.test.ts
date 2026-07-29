import { describe, expect, it, vi } from 'vitest';
import { fetchAuthorizationContext, writeAuditLog } from './authorization';
import type { KutekaSupabaseClient } from './index';

function mockClient(handlers: {
  roles?: unknown;
  permissions?: unknown;
  rolesError?: { message: string };
  permissionsError?: { message: string };
  auditId?: string;
  auditError?: { message: string };
}): KutekaSupabaseClient {
  return {
    rpc: vi.fn(async (fn: string) => {
      if (fn === 'get_user_role_codes') {
        return { data: handlers.roles ?? [], error: handlers.rolesError ?? null };
      }
      if (fn === 'get_user_permission_codes') {
        return { data: handlers.permissions ?? [], error: handlers.permissionsError ?? null };
      }
      if (fn === 'write_audit_log') {
        return { data: handlers.auditId ?? null, error: handlers.auditError ?? null };
      }
      return { data: null, error: { message: `unknown rpc ${fn}` } };
    }),
  } as unknown as KutekaSupabaseClient;
}

describe('fetchAuthorizationContext', () => {
  it('maps DB role and permission codes', async () => {
    const client = mockClient({
      roles: ['client', 'administrator'],
      permissions: ['platform.access', 'admin.panel'],
    });
    const ctx = await fetchAuthorizationContext(client, 'u1', 'a@b.c');
    expect(ctx).toEqual({
      userId: 'u1',
      email: 'a@b.c',
      roles: ['client', 'administrator'],
      permissions: ['platform.access', 'admin.panel'],
    });
  });

  it('fails when RPC errors', async () => {
    const client = mockClient({ rolesError: { message: 'boom' } });
    await expect(fetchAuthorizationContext(client, 'u1')).rejects.toThrow(/roles/);
  });
});

describe('writeAuditLog', () => {
  it('calls security definer RPC', async () => {
    const client = mockClient({ auditId: '00000000-0000-0000-0000-000000000001' });
    const id = await writeAuditLog(client, { action: 'auth.login', entityType: 'user' });
    expect(id).toBe('00000000-0000-0000-0000-000000000001');
    expect(client.rpc).toHaveBeenCalledWith('write_audit_log', {
      p_action: 'auth.login',
      p_entity_type: 'user',
      p_entity_id: null,
      p_metadata: null,
    });
  });
});
