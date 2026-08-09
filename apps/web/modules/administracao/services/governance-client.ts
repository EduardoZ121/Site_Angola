'use client';

import { createBrowserClient } from '@/lib/supabase/client';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { getAdministracaoCopy } from '../content';

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  reason: string | null;
  actor_roles: string[] | null;
  before_state: unknown;
  after_state: unknown;
  metadata: unknown;
  created_at: string;
};

export type ContentReportRow = {
  id: string;
  target_kind: string;
  target_id: string;
  property_id: string | null;
  reason_code: string;
  details: string | null;
  status: string;
  reporter_id: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentReportStatus = 'resolved' | 'dismissed' | 'reviewing';

export type KosOpsMetrics = {
  generatedAt: string;
  publicationInReview: number;
  publicationOverdueSla: number;
  publicationApproved7d: number;
  publicationRejected7d: number;
  avgApprovalHours30d: number;
  rejectionRate7d: number;
  interestsTotal: number;
  contractsStarted: number;
  contractsCompleted: number;
  interestToContractRate: number;
  contentReportsOpen: number;
};

export type UserActivityRow = {
  id: string;
  user_id: string;
  event_type: string;
  title: string;
  summary: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: unknown;
  occurred_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function parseAuditLog(raw: unknown): AuditLogRow | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const action = asString(raw.action);
  if (!id || !action) return null;
  const roles = raw.actor_roles;
  return {
    id,
    actor_id: asString(raw.actor_id),
    actor_name: asString(raw.actor_name),
    action,
    entity_type: asString(raw.entity_type),
    entity_id: asString(raw.entity_id),
    reason: asString(raw.reason),
    actor_roles: Array.isArray(roles)
      ? roles.filter((r): r is string => typeof r === 'string')
      : null,
    before_state: raw.before_state ?? null,
    after_state: raw.after_state ?? null,
    metadata: raw.metadata ?? null,
    created_at: asString(raw.created_at) ?? new Date(0).toISOString(),
  };
}

function parseContentReport(raw: unknown): ContentReportRow | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const targetKind = asString(raw.target_kind);
  const targetId = asString(raw.target_id);
  if (!id || !targetKind || !targetId) return null;
  return {
    id,
    target_kind: targetKind,
    target_id: targetId,
    property_id: asString(raw.property_id),
    reason_code: asString(raw.reason_code) ?? 'other',
    details: asString(raw.details),
    status: asString(raw.status) ?? 'open',
    reporter_id: asString(raw.reporter_id),
    resolution_notes: asString(raw.resolution_notes),
    created_at: asString(raw.created_at) ?? new Date(0).toISOString(),
    updated_at: asString(raw.updated_at) ?? new Date(0).toISOString(),
  };
}

function parseKosMetrics(raw: unknown): KosOpsMetrics | null {
  if (!isRecord(raw)) return null;
  return {
    generatedAt: asString(raw.generatedAt) ?? new Date().toISOString(),
    publicationInReview: asNumber(raw.publicationInReview),
    publicationOverdueSla: asNumber(raw.publicationOverdueSla),
    publicationApproved7d: asNumber(raw.publicationApproved7d),
    publicationRejected7d: asNumber(raw.publicationRejected7d),
    avgApprovalHours30d: asNumber(raw.avgApprovalHours30d),
    rejectionRate7d: asNumber(raw.rejectionRate7d),
    interestsTotal: asNumber(raw.interestsTotal),
    contractsStarted: asNumber(raw.contractsStarted),
    contractsCompleted: asNumber(raw.contractsCompleted),
    interestToContractRate: asNumber(raw.interestToContractRate),
    contentReportsOpen: asNumber(raw.contentReportsOpen),
  };
}

function parseUserActivity(raw: unknown): UserActivityRow | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const title = asString(raw.title);
  if (!id || !title) return null;
  return {
    id,
    user_id: asString(raw.user_id) ?? '',
    event_type: asString(raw.event_type) ?? '',
    title,
    summary: asString(raw.summary),
    entity_type: asString(raw.entity_type),
    entity_id: asString(raw.entity_id),
    metadata: raw.metadata ?? null,
    occurred_at: asString(raw.occurred_at) ?? new Date(0).toISOString(),
  };
}

function isForbiddenMessage(msg: string): boolean {
  return (
    msg.includes('audit.read') ||
    msg.includes('moderation.manage') ||
    msg.includes('admin.panel') ||
    msg.includes('admin metrics') ||
    msg.includes('not allowed')
  );
}

export async function listAuditLogs(
  limit = 50,
  actionPrefix?: string,
): Promise<{ ok: true; data: AuditLogRow[] } | { ok: false; message: string }> {
  const copy = getAdministracaoCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('admin_list_audit_logs', {
      p_limit: limit,
      p_action_prefix: actionPrefix?.trim() ? actionPrefix.trim() : null,
    });
    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      if (isForbiddenMessage(msg)) return { ok: false, message: copy.forbidden };
      return { ok: false, message: copy.loadError };
    }
    const rows = Array.isArray(data) ? data : [];
    return {
      ok: true,
      data: rows.map(parseAuditLog).filter((row): row is AuditLogRow => row != null),
    };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listContentReports(
  limit = 50,
): Promise<{ ok: true; data: ContentReportRow[] } | { ok: false; message: string }> {
  const copy = getAdministracaoCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('admin_list_content_reports', {
      p_limit: limit,
    });
    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      if (isForbiddenMessage(msg)) return { ok: false, message: copy.forbidden };
      return { ok: false, message: copy.loadError };
    }
    const rows = Array.isArray(data) ? data : [];
    return {
      ok: true,
      data: rows.map(parseContentReport).filter((row): row is ContentReportRow => row != null),
    };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function resolveContentReport(
  id: string,
  status: ContentReportStatus,
  notes?: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const copy = getAdministracaoCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const { error } = await client.rpc('admin_resolve_content_report', {
      p_report_id: id,
      p_status: status,
      p_resolution_notes: notes?.trim() ? notes.trim() : null,
    });
    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      if (isForbiddenMessage(msg)) return { ok: false, message: copy.forbidden };
      return { ok: false, message: copy.moderationResolveError };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: copy.moderationResolveError };
  }
}

export async function fetchKosOpsMetrics(): Promise<
  { ok: true; data: KosOpsMetrics } | { ok: false; message: string }
> {
  const copy = getAdministracaoCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kos_ops_metrics');
    if (error || !data) {
      const msg = error?.message?.toLowerCase() ?? '';
      if (isForbiddenMessage(msg)) return { ok: false, message: copy.forbidden };
      return { ok: false, message: copy.loadError };
    }
    const parsed = parseKosMetrics(data);
    if (!parsed) return { ok: false, message: copy.loadError };
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listUserActivity(
  userId?: string,
  limit = 40,
): Promise<{ ok: true; data: UserActivityRow[] } | { ok: false; message: string }> {
  const copy = getAdministracaoCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('list_user_activity', {
      p_user_id: userId ?? null,
      p_limit: limit,
    });
    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      if (isForbiddenMessage(msg)) return { ok: false, message: copy.forbidden };
      return { ok: false, message: copy.loadError };
    }
    const rows = Array.isArray(data) ? data : [];
    return {
      ok: true,
      data: rows.map(parseUserActivity).filter((row): row is UserActivityRow => row != null),
    };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}
