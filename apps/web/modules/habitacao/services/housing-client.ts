'use client';

import { clientPreferencesSchema, type ClientPreferencesInput } from '@kuteka/validation';
import { writeAuditLog } from '@kuteka/database';
import { createBrowserClient } from '@/lib/supabase/client';
import { getHabitacaoCopy } from '../content/pt';

export type HousingPropertyRow = {
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

export type ClientPreferencesRow = {
  user_id: string;
  purpose: string | null;
  province: string | null;
  city: string | null;
  updated_at: string;
};

const PROPERTY_SELECT =
  'id, code, title, property_type, purpose, province, city, address_line, status, created_at';

export async function getClientPreferences(): Promise<
  { ok: true; data: ClientPreferencesRow | null } | { ok: false; message: string }
> {
  const copy = getHabitacaoCopy();
  try {
    const client = createBrowserClient();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user) return { ok: false, message: copy.forbidden };

    const { data, error } = await client
      .from('client_preferences')
      .select('user_id, purpose, province, city, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as ClientPreferencesRow | null) ?? null };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function saveClientPreferences(
  input: ClientPreferencesInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const copy = getHabitacaoCopy();
  const parsed = clientPreferencesSchema.safeParse(input);
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
    const row = {
      user_id: user.id,
      purpose: v.purpose ?? null,
      province: v.province || null,
      city: v.city || null,
      created_by: user.id,
      updated_by: user.id,
    };

    const { error } = await client.from('client_preferences').upsert(row, {
      onConflict: 'user_id',
    });

    if (error) {
      if (error.code === '42501' || error.message?.toLowerCase().includes('policy')) {
        return { ok: false, message: copy.forbidden };
      }
      return { ok: false, message: copy.saveError };
    }

    try {
      await writeAuditLog(client, {
        action: 'housing.preferences_saved',
        entityType: 'client_preferences',
        entityId: user.id,
        metadata: {
          purpose: row.purpose,
          province: row.province,
          city: row.city,
        },
      });
    } catch {
      // Preferences saved; audit is best-effort for MVP.
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
): Promise<{ ok: true; data: HousingPropertyRow[] } | { ok: false; message: string }> {
  const copy = getHabitacaoCopy();
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
    return { ok: true, data: (data as HousingPropertyRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function getActiveProperty(
  id: string,
): Promise<{ ok: true; data: HousingPropertyRow } | { ok: false; message: string }> {
  const copy = getHabitacaoCopy();
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
    return { ok: true, data: data as HousingPropertyRow };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}
