'use client';

import { createBrowserClient } from '@/lib/supabase/client';
import {
  extensionForMediaFile,
  mediaKindFromFile,
  mediaKindFromUrl,
  preparePropertyMediaFile,
  type PropertyMediaKind,
} from '@/lib/media/property-media';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { getPatrimoniosCopy } from '../content';

export type PropertyMediaRow = {
  id: string;
  property_id: string;
  storage_path: string | null;
  public_url: string;
  sort_order: number;
  is_primary: boolean;
  media_kind?: PropertyMediaKind | null;
};

export type LocalMediaDraft = {
  key: string;
  file?: File;
  previewUrl: string;
  isPrimary: boolean;
  kind?: PropertyMediaKind;
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
    const withKind = await client
      .from('property_media')
      .select('id, property_id, storage_path, public_url, sort_order, is_primary, media_kind')
      .eq('property_id', propertyId)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true });

    if (!withKind.error) {
      return { ok: true, data: (withKind.data as PropertyMediaRow[]) ?? [] };
    }

    // Pre-migration 0031: column media_kind may be absent.
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
    let videoUrl: string | null = null;

    for (const draft of drafts) {
      let publicUrl = draft.publicUrl ?? null;
      let storagePath = draft.storagePath ?? null;
      let kind: PropertyMediaKind =
        draft.kind ??
        (draft.file
          ? mediaKindFromFile(draft.file)
          : mediaKindFromUrl(draft.publicUrl ?? draft.previewUrl));

      if (draft.file) {
        let prepared: File;
        try {
          prepared = await preparePropertyMediaFile(draft.file);
        } catch (err) {
          const code = err instanceof Error ? err.message : '';
          if (code === 'VIDEO_TOO_LARGE') return { ok: false, message: copy.media.videoTooLarge };
          return { ok: false, message: copy.media.unsupported };
        }
        kind = mediaKindFromFile(draft.file);
        const ext = extensionForMediaFile(draft.file, prepared.type);
        const path = `${user.id}/${propertyId}/${crypto.randomUUID()}.${ext}`;
        const { error: upError } = await client.storage
          .from('property-media')
          .upload(path, prepared, { contentType: prepared.type || draft.file.type, upsert: false });
        if (upError) return { ok: false, message: copy.mediaUploadError };
        const { data: pub } = client.storage.from('property-media').getPublicUrl(path);
        publicUrl = pub.publicUrl;
        storagePath = path;
      }

      if (!publicUrl) continue;

      const rowBase = {
        property_id: propertyId,
        storage_path: storagePath,
        public_url: publicUrl,
        sort_order: sort,
        is_primary: draft.isPrimary,
        created_by: user.id,
        updated_by: user.id,
      };

      let { error } = await client.from('property_media').insert({
        ...rowBase,
        media_kind: kind,
      });
      if (error) {
        // Fallback when migration 0031 is not applied yet.
        ({ error } = await client.from('property_media').insert(rowBase));
      }
      if (error) return { ok: false, message: copy.mediaUploadError };

      if (kind === 'image' && (draft.isPrimary || coverUrl == null)) {
        coverUrl = publicUrl;
      }
      if (kind === 'video' && (draft.isPrimary || videoUrl == null)) {
        videoUrl = publicUrl;
      }
      sort += 1;
    }

    const patch: Record<string, unknown> = { updated_by: user.id };
    if (coverUrl) patch.cover_image_url = coverUrl;
    if (videoUrl) patch.video_url = videoUrl;

    if (coverUrl || videoUrl) {
      await client.from('properties').update(patch).eq('id', propertyId);
    }

    return { ok: true };
  } catch {
    return { ok: false, message: copy.mediaUploadError };
  }
}
