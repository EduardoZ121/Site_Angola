'use client';

import { assignCertifiedAgentSchema, type AssignCertifiedAgentInput } from '@kuteka/validation';
import { createBrowserClient } from '@/lib/supabase/client';
import { getAdministracaoCopy } from '../content/pt';

export type AdminUserRow = {
  id: string;
  display_name: string | null;
  locale: string;
  created_at: string;
  roles: string[];
};

export type PlatformStats = {
  profiles: number;
  properties_active: number;
  agent_assignments_active: number;
  roles_certified_agent: number;
  trust_pending?: number;
  interests_pending?: number;
  properties_demo?: number;
};

export type AdminInterestRow = {
  id: string;
  property_id: string;
  client_id: string;
  status: string;
  created_at: string;
  property_title?: string | null;
};

export async function fetchPlatformStats(): Promise<
  { ok: true; data: PlatformStats } | { ok: false; message: string }
> {
  const copy = getAdministracaoCopy();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('admin_platform_stats');
    if (error || !data) return { ok: false, message: copy.loadError };
    const stats = data as PlatformStats;
    return { ok: true, data: stats };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listAdminUsers(): Promise<
  { ok: true; data: AdminUserRow[] } | { ok: false; message: string }
> {
  const copy = getAdministracaoCopy();
  try {
    const client = createBrowserClient();
    const { data: profiles, error: profilesError } = await client
      .from('profiles')
      .select('id, display_name, locale, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (profilesError || !profiles) return { ok: false, message: copy.loadError };

    const ids = profiles.map((p) => p.id as string);
    const { data: roleRows, error: rolesError } = await client
      .from('user_roles')
      .select('user_id, roles(code)')
      .in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);

    if (rolesError) return { ok: false, message: copy.loadError };

    const rolesByUser = new Map<string, string[]>();
    for (const row of roleRows ?? []) {
      const userId = row.user_id as string;
      const nested = row.roles as { code?: string } | { code?: string }[] | null;
      const code = Array.isArray(nested) ? nested[0]?.code : nested?.code;
      if (!code) continue;
      const list = rolesByUser.get(userId) ?? [];
      list.push(code);
      rolesByUser.set(userId, list);
    }

    return {
      ok: true,
      data: profiles.map((p) => ({
        id: p.id as string,
        display_name: (p.display_name as string | null) ?? null,
        locale: p.locale as string,
        created_at: p.created_at as string,
        roles: rolesByUser.get(p.id as string) ?? [],
      })),
    };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listPendingInterests(): Promise<
  { ok: true; data: AdminInterestRow[] } | { ok: false; message: string }
> {
  const copy = getAdministracaoCopy();
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('property_interests')
      .select('id, property_id, client_id, status, created_at, properties(title)')
      .in('status', ['submitted', 'reviewing'])
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) return { ok: false, message: copy.loadError };
    return {
      ok: true,
      data: (data ?? []).map((row) => {
        const nested = row.properties as { title?: string } | { title?: string }[] | null;
        const title = Array.isArray(nested) ? nested[0]?.title : nested?.title;
        return {
          id: row.id as string,
          property_id: row.property_id as string,
          client_id: row.client_id as string,
          status: row.status as string,
          created_at: row.created_at as string,
          property_title: title ?? null,
        };
      }),
    };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function assignCertifiedAgent(
  input: AssignCertifiedAgentInput,
): Promise<{ ok: true; already?: boolean } | { ok: false; message: string }> {
  const copy = getAdministracaoCopy();
  const parsed = assignCertifiedAgentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.loadError };
  }

  try {
    const client = createBrowserClient();
    const { error } = await client.rpc('assign_certified_agent', {
      p_user_id: parsed.data.userId,
    });

    if (error) {
      if (error.message?.toLowerCase().includes('admin.panel')) {
        return { ok: false, message: copy.forbidden };
      }
      return { ok: false, message: copy.loadError };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}
