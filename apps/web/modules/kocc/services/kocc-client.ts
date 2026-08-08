'use client';

import { createBrowserClient } from '@/lib/supabase/client';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { getFinanceCopy } from '@/modules/finance/content';
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
  kind: 'feedback' | 'bug';
  body: string;
  pagePath?: string;
}): Promise<Result<{ id: string }>> {
  const copy = errors();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kocc_submit_beta_feedback', {
      p_kind: input.kind,
      p_body: input.body,
      p_page_path: input.pagePath ?? null,
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
