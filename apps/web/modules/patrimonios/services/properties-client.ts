'use client';

import { activatePropertySchema, type ActivatePropertyInput } from '@kuteka/validation';
import { writeAuditLog } from '@kuteka/database';
import { createBrowserClient } from '@/lib/supabase/client';
import { getPatrimoniosCopy } from '../content/pt';

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
  created_at: string;
  updated_at: string;
};

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
      .select(
        'id, owner_id, code, title, property_type, purpose, province, city, address_line, status, notes, created_at, updated_at',
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as PropertyRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function getProperty(
  id: string,
): Promise<{ ok: true; data: PropertyRow } | { ok: false; message: string }> {
  const copy = getPatrimoniosCopy();
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('properties')
      .select(
        'id, owner_id, code, title, property_type, purpose, province, city, address_line, status, notes, created_at, updated_at',
      )
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !data) return { ok: false, message: copy.loadError };
    return { ok: true, data: data as PropertyRow };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function activateProperty(
  input: ActivatePropertyInput,
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

    try {
      await writeAuditLog(client, {
        action: 'property.activated',
        entityType: 'property',
        entityId: data.id,
        metadata: { code: row.code, title: row.title },
      });
    } catch {
      // Activation succeeded; audit is best-effort for MVP.
    }

    return { ok: true, id: data.id as string };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}
