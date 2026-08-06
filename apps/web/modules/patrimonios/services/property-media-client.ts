'use client';

import { createBrowserClient } from '@/lib/supabase/client';
import { compressImageFile } from '@/lib/media/compress-image';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { getPatrimoniosCopy } from '../content';

export type PropertyMediaRow = {
  id: string;
  property_id: string;
  storage_path: string | null;
  public_url: string;
  sort_order: number;
  is_primary: boolean;
};

export type LocalMediaDraft = {
  key: string;
  file?: File;
  previewUrl: string;
  isPrimary: boolean;
  remoteId?: string;
  storagePath?: string | null;
  publicUrl?: string;
};

export async function listPropertyMedia(
  propertyId: string,
): Promise<{ ok: true; data: PropertyMediaRow[] } | { ok: false; message: string }> {
  const copy = getPatrimoniosCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('property_media')
      .select('id, property_id, storage_path, public_url, sort_order, is_primary')
      .eq('property_id', propertyId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as PropertyMediaRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function uploadPropertyMedia(
  propertyId: string,
  drafts: LocalMediaDraft[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  const copy = getPatrimoniosCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user) return { ok: false, message: copy.forbidden };

    // Soft-delete existing owned media, then rewrite order (keeps MVP simple)
    await client
      .from('property_media')
      .update({ deleted_at: new Date().toISOString(), updated_by: user.id })
      .eq('property_id', propertyId)
      .is('deleted_at', null);

    let sort = 0;
    let coverUrl: string | null = null;

    for (const draft of drafts) {
      let publicUrl = draft.publicUrl ?? null;
      let storagePath = draft.storagePath ?? null;

      if (draft.file) {
        const compressed = await compressImageFile(draft.file);
        const ext = compressed.type === 'image/webp' ? 'webp' : 'jpg';
        const path = `${user.id}/${propertyId}/${crypto.randomUUID()}.${ext}`;
        const { error: upError } = await client.storage
          .from('property-media')
          .upload(path, compressed, { contentType: compressed.type, upsert: false });
        if (upError) return { ok: false, message: copy.mediaUploadError };
        const { data: pub } = client.storage.from('property-media').getPublicUrl(path);
        publicUrl = pub.publicUrl;
        storagePath = path;
      }

      if (!publicUrl) continue;

      const { error } = await client.from('property_media').insert({
        property_id: propertyId,
        storage_path: storagePath,
        public_url: publicUrl,
        sort_order: sort,
        is_primary: draft.isPrimary,
        created_by: user.id,
        updated_by: user.id,
      });
      if (error) return { ok: false, message: copy.mediaUploadError };

      if (draft.isPrimary || coverUrl == null) coverUrl = publicUrl;
      sort += 1;
    }

    if (coverUrl) {
      await client
        .from('properties')
        .update({ cover_image_url: coverUrl, updated_by: user.id })
        .eq('id', propertyId);
    }

    return { ok: true };
  } catch {
    return { ok: false, message: copy.mediaUploadError };
  }
}
