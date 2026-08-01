'use client';

import { activatePropertySchema, type ActivatePropertyInput } from '@kuteka/validation';
import { writeAuditLog } from '@kuteka/database';
import { createBrowserClient } from '@/lib/supabase/client';
import { getPatrimoniosCopy } from '../content/pt';
import { uploadPropertyMedia, type LocalMediaDraft } from './property-media-client';

import { ENRICHED_PROPERTY_SELECT } from '@/modules/listings/types';

export type PropertyRow = {
  id: string;
  owner_id: string;
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
  updated_at: string;
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

const PROPERTY_SELECT = ENRICHED_PROPERTY_SELECT;

function newPropertyCode(): string {
  const n = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
  return `KTK-IMM-${n}`;
}

export async function listMyProperties(): Promise<
  { ok: true; data: PropertyRow[] } | { ok: false; message: string }
> {
  const copy = getPatrimoniosCopy();
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('properties')
      .select(PROPERTY_SELECT)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as PropertyRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

const PROPERTY_SELECT_CORE =
  'id, owner_id, code, title, property_type, purpose, province, city, address_line, status, notes, price_aoa, bedrooms, cover_image_url, is_demo, created_at, updated_at';

export async function getProperty(
  id: string,
): Promise<{ ok: true; data: PropertyRow } | { ok: false; message: string }> {
  const copy = getPatrimoniosCopy();
  try {
    const client = createBrowserClient();
    const enriched = await client
      .from('properties')
      .select(PROPERTY_SELECT)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!enriched.error && enriched.data) {
      return { ok: true, data: enriched.data as PropertyRow };
    }

    // Fallback before migration 0013 is applied.
    const core = await client
      .from('properties')
      .select(PROPERTY_SELECT_CORE)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (core.error || !core.data) return { ok: false, message: copy.loadError };
    return { ok: true, data: core.data as PropertyRow };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function activateProperty(
  input: ActivatePropertyInput,
  mediaDrafts: LocalMediaDraft[] = [],
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const copy = getPatrimoniosCopy();
  const parsed = activatePropertySchema.safeParse(input);
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
    const primary = mediaDrafts.find((m) => m.isPrimary) ?? mediaDrafts[0];
    const row = {
      owner_id: user.id,
      code: newPropertyCode(),
      title: v.title,
      property_type: v.propertyType,
      purpose: v.purpose,
      province: v.province || null,
      city: v.city || null,
      address_line: v.addressLine || null,
      notes: v.notes || null,
      price_aoa: v.priceAoa ?? null,
      bedrooms: v.bedrooms ?? null,
      cover_image_url: primary?.publicUrl ?? null,
      status: v.status ?? 'active',
      created_by: user.id,
      updated_by: user.id,
    };

    const { data, error } = await client.from('properties').insert(row).select('id').single();
    if (error || !data) {
      if (error?.code === '42501' || error?.message?.toLowerCase().includes('policy')) {
        return { ok: false, message: copy.forbidden };
      }
      return { ok: false, message: copy.saveError };
    }

    if (mediaDrafts.length) {
      const mediaResult = await uploadPropertyMedia(data.id as string, mediaDrafts);
      if (!mediaResult.ok) return mediaResult;
    }

    try {
      await writeAuditLog(client, {
        action: 'property.activated',
        entityType: 'property',
        entityId: data.id,
        metadata: { code: row.code, title: row.title, media_count: mediaDrafts.length },
      });
    } catch {
      // best-effort
    }

    return { ok: true, id: data.id as string };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}
