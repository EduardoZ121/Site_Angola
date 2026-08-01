'use client';

import {
  clientPreferencesSchema,
  expressInterestSchema,
  type ClientPreferencesInput,
  type ExpressInterestInput,
} from '@kuteka/validation';
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
  notes: string | null;
  price_aoa: number | null;
  bedrooms: number | null;
  cover_image_url: string | null;
  is_demo: boolean;
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
  'id, code, title, property_type, purpose, province, city, address_line, status, notes, price_aoa, bedrooms, cover_image_url, is_demo, created_at';

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
      // best-effort
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
  propertyType?: string | null;
  query?: string | null;
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
      .order('created_at', { ascending: false })
      .limit(200);

    if (filters.purpose && filters.purpose !== 'both') {
      query = query.in('purpose', [filters.purpose, 'both']);
    }
    if (filters.province?.trim()) {
      query = query.ilike('province', `%${filters.province.trim()}%`);
    }
    if (filters.city?.trim()) {
      query = query.ilike('city', `%${filters.city.trim()}%`);
    }
    if (filters.propertyType?.trim()) {
      query = query.eq('property_type', filters.propertyType.trim());
    }

    const { data, error } = await query;
    if (error) return { ok: false, message: copy.loadError };

    let rows = (data as HousingPropertyRow[]) ?? [];
    const q = filters.query?.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          (r.city ?? '').toLowerCase().includes(q) ||
          (r.province ?? '').toLowerCase().includes(q) ||
          (r.address_line ?? '').toLowerCase().includes(q),
      );
    }
    return { ok: true, data: rows };
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

export async function expressInterest(
  input: ExpressInterestInput,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const copy = getHabitacaoCopy();
  const parsed = expressInterestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.interestError };
  }

  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('express_property_interest', {
      p_property_id: parsed.data.propertyId,
      p_notes: parsed.data.notes ?? null,
    });
    if (error) {
      if (error.message?.toLowerCase().includes('housing.explore')) {
        return { ok: false, message: copy.forbidden };
      }
      return { ok: false, message: copy.interestError };
    }
    return { ok: true, id: data as string };
  } catch {
    return { ok: false, message: copy.interestError };
  }
}

export async function listMyInterests(): Promise<
  | {
      ok: true;
      data: Array<{ id: string; property_id: string; status: string; created_at: string }>;
    }
  | { ok: false; message: string }
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
      .from('property_interests')
      .select('id, property_id, status, created_at')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: data ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}
