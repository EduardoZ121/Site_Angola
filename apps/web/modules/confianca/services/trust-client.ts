'use client';

import {
  reviewTrustDocumentSchema,
  submitTrustDocumentSchema,
  type ReviewTrustDocumentInput,
  type SubmitTrustDocumentInput,
} from '@kuteka/validation';
import { writeAuditLog } from '@kuteka/database';
import { createBrowserClient } from '@/lib/supabase/client';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { getConfiancaCopy } from '../content';

export type TrustDocumentRow = {
  id: string;
  user_id: string;
  property_id: string | null;
  doc_type: string;
  status: string;
  notes: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

const TRUST_SELECT =
  'id, user_id, property_id, doc_type, status, notes, rejection_reason, reviewed_by, reviewed_at, created_at, updated_at';

export async function listMyTrustDocuments(): Promise<
  { ok: true; data: TrustDocumentRow[] } | { ok: false; message: string }
> {
  const copy = getConfiancaCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user) return { ok: false, message: copy.forbidden };

    const { data, error } = await client
      .from('trust_documents')
      .select(TRUST_SELECT)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as TrustDocumentRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listPendingTrustDocuments(): Promise<
  { ok: true; data: TrustDocumentRow[] } | { ok: false; message: string }
> {
  const copy = getConfiancaCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('trust_documents')
      .select(TRUST_SELECT)
      .in('status', ['submitted', 'under_review'])
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      if (error.message?.toLowerCase().includes('admin.panel') || error.code === '42501') {
        return { ok: false, message: copy.reviewForbidden };
      }
      return { ok: false, message: copy.loadError };
    }
    return { ok: true, data: (data as TrustDocumentRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function submitTrustDocument(
  input: SubmitTrustDocumentInput,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const copy = getConfiancaCopy(resolveUiLocale());
  const parsed = submitTrustDocumentSchema.safeParse(input);
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
    const { data, error } = await client
      .from('trust_documents')
      .insert({
        user_id: user.id,
        doc_type: v.docType,
        notes: v.notes?.trim() ? v.notes.trim() : null,
        property_id: v.propertyId || null,
        status: 'submitted',
        created_by: user.id,
        updated_by: user.id,
      })
      .select('id')
      .single();

    if (error || !data) {
      if (error?.code === '42501' || error?.message?.toLowerCase().includes('policy')) {
        return { ok: false, message: copy.forbidden };
      }
      return { ok: false, message: copy.saveError };
    }

    try {
      await writeAuditLog(client, {
        action: 'trust.document_submitted',
        entityType: 'trust_document',
        entityId: data.id,
        metadata: { doc_type: v.docType },
      });
    } catch {
      // best-effort
    }

    return { ok: true, id: data.id as string };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function reviewTrustDocument(
  input: ReviewTrustDocumentInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const copy = getConfiancaCopy(resolveUiLocale());
  const parsed = reviewTrustDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }

  try {
    const client = createBrowserClient();
    const { error } = await client.rpc('review_trust_document', {
      p_document_id: parsed.data.documentId,
      p_status: parsed.data.status,
      p_rejection_reason: parsed.data.rejectionReason?.trim() || null,
    });

    if (error) {
      if (error.message?.toLowerCase().includes('admin.panel')) {
        return { ok: false, message: copy.reviewForbidden };
      }
      if (error.message?.toLowerCase().includes('rejection reason')) {
        return { ok: false, message: copy.rejectionReasonRequired };
      }
      return { ok: false, message: copy.saveError };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}
