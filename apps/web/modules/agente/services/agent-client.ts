'use client';

import {
  activateAssignmentSchema,
  agentPreferencesSchema,
  type ActivateAssignmentInput,
  type AgentPreferencesInput,
} from '@kuteka/validation';
import { writeAuditLog } from '@kuteka/database';
import { createBrowserClient } from '@/lib/supabase/client';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { getAgenteCopy } from '../content';

export type AgentPropertyRow = {
  id: string;
  code: string;
  title: string;
  property_type: string;
  purpose: string;
  province: string | null;
  city: string | null;
  address_line: string | null;
  status: string;
  created_at: string;
};

export type AgentPreferencesRow = {
  user_id: string;
  purpose: string | null;
  province: string | null;
  city: string | null;
  updated_at: string;
};

export type AgentAssignmentRow = {
  id: string;
  agent_id: string;
  property_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  property?: AgentPropertyRow | null;
};

const PROPERTY_SELECT =
  'id, code, title, property_type, purpose, province, city, address_line, status, created_at';

export async function getAgentPreferences(): Promise<
  { ok: true; data: AgentPreferencesRow | null } | { ok: false; message: string }
> {
  const copy = getAgenteCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user) return { ok: false, message: copy.forbidden };

    const { data, error } = await client
      .from('agent_preferences')
      .select('user_id, purpose, province, city, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as AgentPreferencesRow | null) ?? null };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function saveAgentPreferences(
  input: AgentPreferencesInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const copy = getAgenteCopy(resolveUiLocale());
  const parsed = agentPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }

  try {
    const client = createBrowserClient();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user) return { ok: false, message: copy.forbidden };

    const v = parsed.data;
    const { error } = await client.from('agent_preferences').upsert(
      {
        user_id: user.id,
        purpose: v.purpose ?? null,
        province: v.province || null,
        city: v.city || null,
        created_by: user.id,
        updated_by: user.id,
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      if (error.code === '42501' || error.message?.toLowerCase().includes('policy')) {
        return { ok: false, message: copy.forbidden };
      }
      return { ok: false, message: copy.saveError };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export type ExploreFilters = {
  purpose?: string | null;
  province?: string | null;
  city?: string | null;
};

export async function exploreActiveProperties(
  filters: ExploreFilters = {},
): Promise<{ ok: true; data: AgentPropertyRow[] } | { ok: false; message: string }> {
  const copy = getAgenteCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    let query = client
      .from('properties')
      .select(PROPERTY_SELECT)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (filters.purpose && filters.purpose !== 'both') {
      query = query.in('purpose', [filters.purpose, 'both']);
    }
    if (filters.province?.trim()) {
      query = query.ilike('province', filters.province.trim());
    }
    if (filters.city?.trim()) {
      query = query.ilike('city', filters.city.trim());
    }

    const { data, error } = await query;
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as AgentPropertyRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function getActiveProperty(
  id: string,
): Promise<{ ok: true; data: AgentPropertyRow } | { ok: false; message: string }> {
  const copy = getAgenteCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('properties')
      .select(PROPERTY_SELECT)
      .eq('id', id)
      .eq('status', 'active')
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !data) return { ok: false, message: copy.loadError };
    return { ok: true, data: data as AgentPropertyRow };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listMyAssignments(): Promise<
  { ok: true; data: AgentAssignmentRow[] } | { ok: false; message: string }
> {
  const copy = getAgenteCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('agent_assignments')
      .select(
        `id, agent_id, property_id, status, notes, created_at, property:properties (${PROPERTY_SELECT})`,
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) return { ok: false, message: copy.loadError };
    const rows = (data ?? []).map((item) => {
      const nested = item.property;
      const property = Array.isArray(nested)
        ? ((nested[0] as AgentPropertyRow | undefined) ?? null)
        : ((nested as AgentPropertyRow | null) ?? null);
      return {
        id: item.id as string,
        agent_id: item.agent_id as string,
        property_id: item.property_id as string,
        status: item.status as string,
        notes: (item.notes as string | null) ?? null,
        created_at: item.created_at as string,
        property,
      } satisfies AgentAssignmentRow;
    });
    return { ok: true, data: rows };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function getMyAssignmentForProperty(
  propertyId: string,
): Promise<{ ok: true; data: AgentAssignmentRow | null } | { ok: false; message: string }> {
  const copy = getAgenteCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user) return { ok: false, message: copy.forbidden };

    const { data, error } = await client
      .from('agent_assignments')
      .select('id, agent_id, property_id, status, notes, created_at')
      .eq('agent_id', user.id)
      .eq('property_id', propertyId)
      .maybeSingle();

    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as AgentAssignmentRow | null) ?? null };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function activateAssignment(
  input: ActivateAssignmentInput,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const copy = getAgenteCopy(resolveUiLocale());
  const parsed = activateAssignmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }

  try {
    const client = createBrowserClient();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user) return { ok: false, message: copy.forbidden };

    const existing = await getMyAssignmentForProperty(parsed.data.propertyId);
    if (existing.ok && existing.data?.status === 'active') {
      return { ok: false, message: copy.alreadyAssigned };
    }

    const row = {
      agent_id: user.id,
      property_id: parsed.data.propertyId,
      status: 'active',
      notes: parsed.data.notes || null,
      created_by: user.id,
      updated_by: user.id,
    };

    const { data, error } =
      existing.ok && existing.data
        ? await client
            .from('agent_assignments')
            .update({
              status: 'active',
              notes: row.notes,
              updated_by: user.id,
            })
            .eq('id', existing.data.id)
            .select('id')
            .single()
        : await client.from('agent_assignments').insert(row).select('id').single();

    if (error || !data) {
      if (error?.code === '42501' || error?.message?.toLowerCase().includes('policy')) {
        return { ok: false, message: copy.forbidden };
      }
      return { ok: false, message: copy.saveError };
    }

    try {
      await writeAuditLog(client, {
        action: 'agent.assignment_activated',
        entityType: 'agent_assignment',
        entityId: data.id,
        metadata: { property_id: parsed.data.propertyId },
      });
    } catch {
      // best-effort
    }

    return { ok: true, id: data.id as string };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}
