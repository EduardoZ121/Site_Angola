'use client';

import { createBrowserClient } from '@/lib/supabase/client';
import { profileFromRpc, vaultErrorMessage, type CompanyProfileInput } from '../lib/company-vault';

type Result<T> = { ok: true; data: T } | { ok: false; message: string };

export type CompanyVaultStatus = {
  isOwner: boolean;
  codeConfigured: boolean;
  lockedUntil: string | null;
  failedAttempts: number;
};

export type CompanyProfileRecord = CompanyProfileInput & { updatedAt: string | null };

function asObject(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

function fail(error: { message?: string } | null, fallback: string): Result<never> {
  return { ok: false, message: vaultErrorMessage(error?.message || fallback) };
}

export async function fetchCompanyVaultStatus(): Promise<Result<CompanyVaultStatus>> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('founder_company_vault_status');
    if (error) return fail(error, 'load');
    const row = asObject(data);
    return {
      ok: true,
      data: {
        isOwner: Boolean(row.isOwner),
        codeConfigured: Boolean(row.codeConfigured),
        lockedUntil: row.lockedUntil != null ? String(row.lockedUntil) : null,
        failedAttempts: Number(row.failedAttempts ?? 0),
      },
    };
  } catch (error) {
    return fail(error instanceof Error ? error : null, 'load');
  }
}

export async function setCompanyVaultCode(input: {
  newCode: string;
  currentCode?: string | null;
}): Promise<Result<{ codeConfigured: boolean }>> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('founder_company_vault_set_code', {
      p_new_code: input.newCode.trim(),
      p_current_code: input.currentCode?.trim() ? input.currentCode.trim() : null,
    });
    if (error) return fail(error, 'save');
    const row = asObject(data);
    return { ok: true, data: { codeConfigured: Boolean(row.codeConfigured) } };
  } catch (error) {
    return fail(error instanceof Error ? error : null, 'save');
  }
}

export async function readCompanyProfile(code: string): Promise<Result<CompanyProfileRecord>> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('founder_company_profile_read', {
      p_code: code.trim(),
    });
    if (error) return fail(error, 'load');
    return { ok: true, data: profileFromRpc(asObject(data)) };
  } catch (error) {
    return fail(error instanceof Error ? error : null, 'load');
  }
}

export async function updateCompanyProfile(
  code: string,
  patch: CompanyProfileInput,
): Promise<Result<CompanyProfileRecord>> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('founder_company_profile_update', {
      p_code: code.trim(),
      p_patch: patch,
    });
    if (error) return fail(error, 'save');
    return { ok: true, data: profileFromRpc(asObject(data)) };
  } catch (error) {
    return fail(error instanceof Error ? error : null, 'save');
  }
}
