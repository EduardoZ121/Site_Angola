'use client';

import { createBrowserClient } from '@/lib/supabase/client';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { getFinanceCopy } from '@/modules/finance/content';
import {
  isValidBetaFeedbackBody,
  isValidBetaFeedbackKind,
  isValidBetaFeedbackKindAny,
  normalizeBetaFeedbackBody,
  sanitizeBetaPagePath,
} from '../lib/beta-feedback-submit';
import { isBetaFeedbackStatus, sanitizeBetaPageContext } from '../lib/beta-feedback-status';
import type { KoccOperationalStatus } from '../lib/status-labels';

export type KoccFlagRow = {
  code: string;
  label: string;
  description: string | null;
  enabled: boolean;
  operational_status: KoccOperationalStatus;
  module_version: string | null;
  activated_at: string | null;
  notes: string | null;
  allowed_roles: string[];
  allowed_countries: string[];
  environments: string[];
  metadata: Record<string, unknown> | null;
  updated_at: string;
  updated_by: string | null;
};

export type KoccAuditRow = {
  id: string;
  flag_code: string;
  actor_id: string | null;
  action: string;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  created_at: string;
};

export type KoccUpsertFlagInput = {
  code: string;
  label: string;
  description?: string | null;
  enabled: boolean;
  operationalStatus: KoccOperationalStatus;
  moduleVersion?: string | null;
  notes?: string | null;
  allowedRoles?: string[];
  allowedCountries?: string[];
  environments?: string[];
};

type Result<T> = { ok: true; data: T } | { ok: false; message: string };

function errors() {
  return getFinanceCopy(resolveUiLocale()).errors;
}

export async function listFlags(): Promise<Result<KoccFlagRow[]>> {
  const copy = errors();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kocc_list_flags');
    if (error) return { ok: false, message: error.message || copy.loadError };
    return { ok: true, data: (data ?? []) as KoccFlagRow[] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function upsertFlag(input: KoccUpsertFlagInput): Promise<Result<KoccFlagRow>> {
  const copy = errors();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kocc_upsert_flag', {
      p_code: input.code,
      p_label: input.label,
      p_description: input.description ?? null,
      p_enabled: input.enabled,
      p_operational_status: input.operationalStatus,
      p_module_version: input.moduleVersion ?? null,
      p_notes: input.notes ?? null,
      p_allowed_roles: input.allowedRoles ?? [],
      p_allowed_countries: input.allowedCountries ?? [],
      p_environments:
        input.environments && input.environments.length > 0 ? input.environments : ['production'],
    });
    if (error) return { ok: false, message: error.message || copy.saveError };
    return { ok: true, data: data as KoccFlagRow };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function listAudit(limit = 30): Promise<Result<KoccAuditRow[]>> {
  const copy = errors();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kocc_list_audit', { p_limit: limit });
    if (error) return { ok: false, message: error.message || copy.loadError };
    return { ok: true, data: (data ?? []) as KoccAuditRow[] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export function parseCsvList(value: string): string[] {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export type KoccFeatureUsage = {
  code: string;
  label: string;
  count: number;
};

export type KoccBetaMetrics = {
  generatedAt: string;
  betaUsers: number;
  profilesTotal: number;
  propertiesReal: number;
  propertiesBetaInventory: number;
  visitsScheduled: number;
  contractsStarted: number;
  feedbackReceived: number;
  bugsReported: number;
  onboardingCompletionRate: number;
  kisCompletionRate: number;
  featuresMostUsed: KoccFeatureUsage[];
  featuresLeastUsed: KoccFeatureUsage[];
  featureUsageProxy: KoccFeatureUsage[];
  modulesOperational: {
    code: string;
    label: string;
    status: string;
    enabled: boolean;
  }[];
};

export async function listBetaMetrics(): Promise<Result<KoccBetaMetrics>> {
  const copy = errors();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kocc_beta_metrics');
    if (error) return { ok: false, message: error.message || copy.loadError };
    return { ok: true, data: data as KoccBetaMetrics };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function submitBetaFeedback(input: {
  kind: 'feedback' | 'bug' | 'avaliacao' | 'reclamacao';
  body: string;
  pagePath?: string;
  pageContext?: Record<string, unknown> | null;
}): Promise<Result<{ id: string }>> {
  const copy = errors();
  try {
    if (!isValidBetaFeedbackKindAny(input.kind) && !isValidBetaFeedbackKind(input.kind)) {
      return { ok: false, message: copy.saveError };
    }
    const body = normalizeBetaFeedbackBody(input.body);
    if (!isValidBetaFeedbackBody(body)) {
      return { ok: false, message: copy.saveError };
    }
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kocc_submit_beta_feedback', {
      p_kind: input.kind,
      p_body: body,
      p_page_path: sanitizeBetaPagePath(input.pagePath),
      p_page_context: sanitizeBetaPageContext(input.pageContext) ?? {},
    });
    if (error) return { ok: false, message: error.message || copy.saveError };
    const row = data as { id?: string } | null;
    return { ok: true, data: { id: row?.id ?? '' } };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function trackBetaFeature(code: string, label?: string): Promise<void> {
  try {
    const client = createBrowserClient();
    await client.rpc('kocc_track_feature', {
      p_feature_code: code,
      p_label: label ?? null,
    });
  } catch {
    /* non-blocking telemetry */
  }
}

/** Ops triage row — SELECT allowed only via existing RLS (finance.manage | admin.panel | Founder). */
export type KoccBetaFeedbackRow = {
  id: string;
  kind: 'feedback' | 'bug' | 'avaliacao' | 'reclamacao' | string;
  body: string;
  page_path: string | null;
  actor_id: string | null;
  created_at: string;
  status?: string | null;
  page_context?: Record<string, unknown> | null;
  resolution_notes?: string | null;
};

/**
 * Recent beta_feedback for KOCC triage inbox.
 * Reuses table + RLS from migrations 0035 / 0043 / 0046.
 */
export async function listRecentBetaFeedback(limit = 40): Promise<Result<KoccBetaFeedbackRow[]>> {
  const copy = errors();
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('beta_feedback')
      .select(
        'id, kind, body, page_path, actor_id, created_at, status, page_context, resolution_notes',
      )
      .order('created_at', { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 100));
    if (error) return { ok: false, message: error.message || copy.loadError };
    return { ok: true, data: (data ?? []) as KoccBetaFeedbackRow[] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function updateBetaFeedbackStatus(input: {
  id: string;
  status: string;
  resolutionNotes?: string | null;
}): Promise<Result<KoccBetaFeedbackRow>> {
  const copy = errors();
  try {
    if (!isBetaFeedbackStatus(input.status)) {
      return { ok: false, message: copy.saveError };
    }
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kocc_update_beta_feedback_status', {
      p_id: input.id,
      p_status: input.status,
      p_resolution_notes: input.resolutionNotes ?? null,
    });
    if (error) return { ok: false, message: error.message || copy.saveError };
    return { ok: true, data: data as KoccBetaFeedbackRow };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}
