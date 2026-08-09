'use client';

import { createBrowserClient } from '@/lib/supabase/client';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { getFinanceCopy } from '@/modules/finance/content';

type Result<T> = { ok: true; data: T } | { ok: false; message: string };

export type FounderBootstrapStatus = {
  bootstrapOpen: boolean;
  hasOwner: boolean;
  completedAt: string | null;
};

export type InstitutionalDirectoryRow = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  is_system_demo: boolean;
  account_kind: string | null;
  roles: string[];
  is_founder: boolean;
  is_owner: boolean;
};

export type InstitutionalIdentity = {
  authenticated: boolean;
  userId?: string;
  isFounder?: boolean;
  isOwner?: boolean;
  isSystemDemo?: boolean;
  roles?: string[];
  bootstrap?: FounderBootstrapStatus;
};

export type PromoteTargetRole =
  'founder' | 'co_founder' | 'super_administrator' | 'administrator' | 'supervisor' | 'auditor';

export type EmailChangeRequest = {
  requestId: string;
  expiresAt: string;
  oldCode?: string;
  newCode?: string;
  delivery?: string;
};

function errors() {
  return getFinanceCopy(resolveUiLocale()).errors;
}

function asObject(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

export async function bootstrapStatus(): Promise<Result<FounderBootstrapStatus>> {
  const copy = errors();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('founder_bootstrap_status');
    if (error) return { ok: false, message: error.message || copy.loadError };
    const o = asObject(data);
    return {
      ok: true,
      data: {
        bootstrapOpen: Boolean(o.bootstrapOpen),
        hasOwner: Boolean(o.hasOwner),
        completedAt: o.completedAt != null ? String(o.completedAt) : null,
      },
    };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function claimBootstrap(
  displayLabel = 'Founder / Owner',
): Promise<Result<Record<string, unknown>>> {
  const copy = errors();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('founder_bootstrap_claim', {
      p_display_label: displayLabel,
    });
    if (error) return { ok: false, message: error.message || copy.saveError };
    return { ok: true, data: asObject(data) };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function listDirectory(): Promise<Result<InstitutionalDirectoryRow[]>> {
  const copy = errors();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('list_institutional_directory');
    if (error) return { ok: false, message: error.message || copy.loadError };
    const rows = Array.isArray(data) ? data : [];
    return {
      ok: true,
      data: rows.map((row) => {
        const o = asObject(row);
        const rolesRaw = o.roles;
        return {
          user_id: String(o.user_id),
          display_name: o.display_name != null ? String(o.display_name) : null,
          email: o.email != null ? String(o.email) : null,
          is_system_demo: Boolean(o.is_system_demo),
          account_kind: o.account_kind != null ? String(o.account_kind) : null,
          roles: Array.isArray(rolesRaw) ? rolesRaw.map(String) : [],
          is_founder: Boolean(o.is_founder),
          is_owner: Boolean(o.is_owner),
        };
      }),
    };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function promoteUser(input: {
  userId: string;
  role: PromoteTargetRole;
  reason: string;
}): Promise<Result<Record<string, unknown>>> {
  const copy = errors();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('founder_promote_user', {
      p_user_id: input.userId,
      p_target_role: input.role,
      p_reason: input.reason,
    });
    if (error) return { ok: false, message: error.message || copy.saveError };
    return { ok: true, data: asObject(data) };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function getIdentity(): Promise<Result<InstitutionalIdentity>> {
  const copy = errors();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('get_institutional_identity');
    if (error) return { ok: false, message: error.message || copy.loadError };
    const o = asObject(data);
    const rolesRaw = o.roles;
    const bootstrap = asObject(o.bootstrap);
    return {
      ok: true,
      data: {
        authenticated: Boolean(o.authenticated),
        userId: o.userId != null ? String(o.userId) : undefined,
        isFounder: Boolean(o.isFounder),
        isOwner: Boolean(o.isOwner),
        isSystemDemo: Boolean(o.isSystemDemo),
        roles: Array.isArray(rolesRaw) ? rolesRaw.map(String) : [],
        bootstrap: {
          bootstrapOpen: Boolean(bootstrap.bootstrapOpen),
          hasOwner: Boolean(bootstrap.hasOwner),
          completedAt: bootstrap.completedAt != null ? String(bootstrap.completedAt) : null,
        },
      },
    };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function requestEmailChange(newEmail: string): Promise<Result<EmailChangeRequest>> {
  const copy = errors();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('request_email_change', {
      p_new_email: newEmail,
    });
    if (error) return { ok: false, message: error.message || copy.saveError };
    const o = asObject(data);
    return {
      ok: true,
      data: {
        requestId: String(o.requestId),
        expiresAt: String(o.expiresAt ?? ''),
        oldCode: o.oldCode != null ? String(o.oldCode) : undefined,
        newCode: o.newCode != null ? String(o.newCode) : undefined,
        delivery: o.delivery != null ? String(o.delivery) : undefined,
      },
    };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function confirmEmailChange(input: {
  requestId: string;
  oldCode: string;
  newCode: string;
}): Promise<Result<{ ok: boolean; email: string }>> {
  const copy = errors();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('confirm_email_change', {
      p_request_id: input.requestId,
      p_old_code: input.oldCode,
      p_new_code: input.newCode,
    });
    if (error) return { ok: false, message: error.message || copy.saveError };
    const o = asObject(data);
    return {
      ok: true,
      data: { ok: Boolean(o.ok), email: String(o.email ?? '') },
    };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}
