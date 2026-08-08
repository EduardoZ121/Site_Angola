'use client';

import { createBrowserClient } from '@/lib/supabase/client';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { getAdministracaoCopy } from '../content';

export type PublicationDecision =
  | 'approve'
  | 'pending'
  | 'reject'
  | 'request_corrections'
  | 'request_technical_visit'
  | 'request_documents';

export type KaiPreliminary = {
  ok?: boolean;
  score?: number;
  mediaCount?: number;
  issues?: string[];
  suggestions?: string[];
};

export type PublicationQueueItem = {
  review_id: string;
  property_id: string;
  review_status: string;
  kai_preliminary: KaiPreliminary | null;
  pending_reason_codes: string[];
  admin_notes: string | null;
  sla_deadline_at: string | null;
  escalated_at: string | null;
  created_at: string;
  property_code: string | null;
  title: string | null;
  province: string | null;
  city: string | null;
  cover_image_url: string | null;
  owner_id: string;
  owner_name: string | null;
  owner_email: string | null;
  assigned_to: string | null;
  assigned_name: string | null;
  lifecycle_status: string | null;
  marketplace_status: string | null;
};

export type PendingReason = {
  code: string;
  label_pt: string;
  solution_pt: string;
  sort_order: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseKai(value: unknown): KaiPreliminary | null {
  if (!isRecord(value)) return null;
  const issuesRaw = value.issues;
  const suggestionsRaw = value.suggestions;
  return {
    ok: typeof value.ok === 'boolean' ? value.ok : undefined,
    score: typeof value.score === 'number' ? value.score : undefined,
    mediaCount: typeof value.mediaCount === 'number' ? value.mediaCount : undefined,
    issues: Array.isArray(issuesRaw)
      ? issuesRaw.filter((x): x is string => typeof x === 'string')
      : undefined,
    suggestions: Array.isArray(suggestionsRaw)
      ? suggestionsRaw.filter((x): x is string => typeof x === 'string')
      : undefined,
  };
}

function parseQueueItem(raw: unknown): PublicationQueueItem | null {
  if (!isRecord(raw)) return null;
  const propertyId = raw.property_id;
  const reviewId = raw.review_id;
  if (typeof propertyId !== 'string' || typeof reviewId !== 'string') return null;
  const codes = raw.pending_reason_codes;
  return {
    review_id: reviewId,
    property_id: propertyId,
    review_status: typeof raw.review_status === 'string' ? raw.review_status : 'in_review',
    kai_preliminary: parseKai(raw.kai_preliminary),
    pending_reason_codes: Array.isArray(codes)
      ? codes.filter((c): c is string => typeof c === 'string')
      : [],
    admin_notes: typeof raw.admin_notes === 'string' ? raw.admin_notes : null,
    sla_deadline_at: typeof raw.sla_deadline_at === 'string' ? raw.sla_deadline_at : null,
    escalated_at: typeof raw.escalated_at === 'string' ? raw.escalated_at : null,
    created_at: typeof raw.created_at === 'string' ? raw.created_at : new Date(0).toISOString(),
    property_code: typeof raw.property_code === 'string' ? raw.property_code : null,
    title: typeof raw.title === 'string' ? raw.title : null,
    province: typeof raw.province === 'string' ? raw.province : null,
    city: typeof raw.city === 'string' ? raw.city : null,
    cover_image_url: typeof raw.cover_image_url === 'string' ? raw.cover_image_url : null,
    owner_id: typeof raw.owner_id === 'string' ? raw.owner_id : '',
    owner_name: typeof raw.owner_name === 'string' ? raw.owner_name : null,
    owner_email: typeof raw.owner_email === 'string' ? raw.owner_email : null,
    assigned_to: typeof raw.assigned_to === 'string' ? raw.assigned_to : null,
    assigned_name: typeof raw.assigned_name === 'string' ? raw.assigned_name : null,
    lifecycle_status: typeof raw.lifecycle_status === 'string' ? raw.lifecycle_status : null,
    marketplace_status: typeof raw.marketplace_status === 'string' ? raw.marketplace_status : null,
  };
}

export async function listQueue(
  limit = 50,
): Promise<{ ok: true; data: PublicationQueueItem[] } | { ok: false; message: string }> {
  const copy = getAdministracaoCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('admin_list_publication_queue', {
      p_limit: limit,
    });
    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      if (msg.includes('properties.review') || msg.includes('admin.panel')) {
        return { ok: false, message: copy.forbidden };
      }
      return { ok: false, message: copy.loadError };
    }
    const rows = Array.isArray(data) ? data : [];
    return {
      ok: true,
      data: rows.map(parseQueueItem).filter((row): row is PublicationQueueItem => row != null),
    };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listPendingReasons(): Promise<
  { ok: true; data: PendingReason[] } | { ok: false; message: string }
> {
  const copy = getAdministracaoCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('publication_pending_reasons')
      .select('code, label_pt, solution_pt, sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true });
    if (error) return { ok: false, message: copy.loadError };
    return {
      ok: true,
      data: (data ?? []).map((row) => ({
        code: row.code as string,
        label_pt: row.label_pt as string,
        solution_pt: row.solution_pt as string,
        sort_order: Number(row.sort_order ?? 0),
      })),
    };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function assignPublicationReview(
  reviewId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const copy = getAdministracaoCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const { error } = await client.rpc('admin_assign_publication_review', {
      p_review_id: reviewId,
      p_assignee_id: null,
    });
    if (error) {
      return { ok: false, message: error.message || copy.loadError };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function decidePublication(input: {
  propertyId: string;
  decision: PublicationDecision;
  pendingReasonCodes?: string[];
  adminNotes?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const copy = getAdministracaoCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const { error } = await client.rpc('admin_decide_property_publication', {
      p_property_id: input.propertyId,
      p_decision: input.decision,
      p_pending_reason_codes: input.pendingReasonCodes ?? [],
      p_admin_notes: input.adminNotes?.trim() ? input.adminNotes.trim() : null,
    });
    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      if (msg.includes('properties.review') || msg.includes('admin.panel')) {
        return { ok: false, message: copy.forbidden };
      }
      if (msg.includes('pending requires') || msg.includes('invalid decision')) {
        return { ok: false, message: copy.decideError };
      }
      return { ok: false, message: copy.decideError };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: copy.decideError };
  }
}
