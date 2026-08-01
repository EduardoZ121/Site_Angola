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

import { HOUSING_ENRICHED_SELECT, HOUSING_ENRICHED_SELECT_V13 } from '@/modules/listings/types';

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
  description?: string | null;
  video_url?: string | null;
  virtual_tour_url?: string | null;
  floor_plan_url?: string | null;
  documents_url?: string | null;
  year_built?: number | null;
  renovated_year?: number | null;
  area_useful_m2?: number | null;
  area_total_m2?: number | null;
  floors?: number | null;
  bathrooms?: number | null;
  parking_spaces?: number | null;
  monthly_condo_aoa?: number | null;
  condo_rules?: string | null;
  amenities?: unknown;
  latitude?: number | null;
  longitude?: number | null;
  location_exact?: boolean | null;
  neighborhood?: string | null;
  nearby_notes?: string | null;
};

export type ClientPreferencesRow = {
  user_id: string;
  purpose: string | null;
  province: string | null;
  city: string | null;
  updated_at: string;
};

const PROPERTY_SELECT = HOUSING_ENRICHED_SELECT;

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

export type ExplorePageParams = ExploreFilters & {
  /** Zero-based row offset (Supabase range). */
  offset?: number;
  /** Page size — keep small for feed fluidity (default 12). */
  limit?: number;
};

export type ExplorePageResult = {
  rows: HousingPropertyRow[];
  offset: number;
  limit: number;
  hasMore: boolean;
  nextOffset: number;
};

const DEFAULT_EXPLORE_LIMIT = 12;
/** Legacy callers that still want a bounded one-shot list. */
const LEGACY_EXPLORE_CAP = 48;

function filterByQuery(rows: HousingPropertyRow[], query?: string | null): HousingPropertyRow[] {
  const q = query?.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q) ||
      (r.city ?? '').toLowerCase().includes(q) ||
      (r.province ?? '').toLowerCase().includes(q) ||
      (r.address_line ?? '').toLowerCase().includes(q),
  );
}

const PROPERTY_SELECT_CORE =
  'id, code, title, property_type, purpose, province, city, address_line, status, notes, price_aoa, bedrooms, cover_image_url, is_demo, created_at';

/**
 * Paginated explore — foundation for infinite feed at scale.
 * Uses Supabase `.range(from, to)` instead of loading hundreds of rows.
 * List/feed uses core columns (lighter + works before migration 0013).
 */
export async function exploreActivePropertiesPage(
  params: ExplorePageParams = {},
): Promise<{ ok: true; data: ExplorePageResult } | { ok: false; message: string }> {
  const copy = getHabitacaoCopy();
  const offset = Math.max(0, params.offset ?? 0);
  const limit = Math.min(48, Math.max(1, params.limit ?? DEFAULT_EXPLORE_LIMIT));

  try {
    const client = createBrowserClient();
    let query = client
      .from('properties')
      .select(PROPERTY_SELECT_CORE)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (params.purpose && params.purpose !== 'both') {
      query = query.in('purpose', [params.purpose, 'both']);
    }
    if (params.province?.trim()) {
      query = query.ilike('province', `%${params.province.trim()}%`);
    }
    if (params.city?.trim()) {
      query = query.ilike('city', `%${params.city.trim()}%`);
    }
    if (params.propertyType?.trim()) {
      query = query.eq('property_type', params.propertyType.trim());
    }

    // Fetch one extra row to detect hasMore without a separate count query.
    const from = offset;
    const to = offset + limit; // inclusive end → limit+1 rows when available
    const { data, error } = await query.range(from, to);
    if (error) return { ok: false, message: copy.loadError };

    let rows = filterByQuery((data as HousingPropertyRow[]) ?? [], params.query);
    const hasMore = rows.length > limit;
    if (hasMore) rows = rows.slice(0, limit);

    return {
      ok: true,
      data: {
        rows,
        offset,
        limit,
        hasMore,
        nextOffset: offset + rows.length,
      },
    };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

/** @deprecated Prefer exploreActivePropertiesPage for scalable UIs. */
export async function exploreActiveProperties(
  filters: ExploreFilters = {},
): Promise<{ ok: true; data: HousingPropertyRow[] } | { ok: false; message: string }> {
  const page = await exploreActivePropertiesPage({
    ...filters,
    offset: 0,
    limit: LEGACY_EXPLORE_CAP,
  });
  if (!page.ok) return page;
  return { ok: true, data: page.data.rows };
}

export async function getActiveProperty(
  id: string,
): Promise<{ ok: true; data: HousingPropertyRow } | { ok: false; message: string }> {
  const copy = getHabitacaoCopy();
  try {
    const client = createBrowserClient();
    const enriched = await client
      .from('properties')
      .select(PROPERTY_SELECT)
      .eq('id', id)
      .eq('status', 'active')
      .is('deleted_at', null)
      .maybeSingle();

    if (!enriched.error && enriched.data) {
      return { ok: true, data: enriched.data as unknown as HousingPropertyRow };
    }

    const v13 = await client
      .from('properties')
      .select(HOUSING_ENRICHED_SELECT_V13)
      .eq('id', id)
      .eq('status', 'active')
      .is('deleted_at', null)
      .maybeSingle();

    if (!v13.error && v13.data) {
      return { ok: true, data: v13.data as unknown as HousingPropertyRow };
    }

    const core = await client
      .from('properties')
      .select(PROPERTY_SELECT_CORE)
      .eq('id', id)
      .eq('status', 'active')
      .is('deleted_at', null)
      .maybeSingle();

    if (core.error || !core.data) return { ok: false, message: copy.loadError };
    return { ok: true, data: core.data as unknown as HousingPropertyRow };
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
