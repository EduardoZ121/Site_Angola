'use client';

import { createBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/modules/authentication/lib/supabase-config';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { getSegurancaCopy } from '../content';
import { getSmsOtpProvider, normalizeAngolaPhone } from '../providers/sms-otp';
import type { SecurityCenterSnapshot } from '../lib/security-center';

export type SecurityClientResult<T = void> = { ok: true; data: T } | { ok: false; message: string };

function copy() {
  return getSegurancaCopy(resolveUiLocale()).client;
}

function clientOrNull() {
  if (!isSupabaseConfigured()) return null;
  try {
    return createBrowserClient();
  } catch {
    return null;
  }
}

export type IssueOtpResult = {
  challengeId: string;
  channel: string;
  purpose: string;
  expiresInSeconds: number;
  sandboxCode?: string;
  provider: string;
};

export async function loadSecurityCenterSnapshot(): Promise<
  SecurityClientResult<SecurityCenterSnapshot>
> {
  const client = clientOrNull();
  if (!client) {
    return { ok: false, message: copy().authUnavailable };
  }
  try {
    const { data, error } = await client.rpc('get_security_center_snapshot');
    if (error) {
      return {
        ok: false,
        message: error.message || copy().loadError,
      };
    }
    return { ok: true, data: data as SecurityCenterSnapshot };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : copy().networkErrorLoad,
    };
  }
}

export async function issueSecurityOtp(input: {
  channel: 'email' | 'sms';
  purpose: string;
  destination: string;
  userId?: string | null;
}): Promise<SecurityClientResult<IssueOtpResult>> {
  const client = clientOrNull();
  if (!client) {
    return { ok: false, message: copy().authUnavailable };
  }

  let destination = input.destination.trim();
  if (input.channel === 'sms') {
    const normalized = normalizeAngolaPhone(destination);
    if (!normalized) {
      return { ok: false, message: copy().invalidPhone };
    }
    destination = normalized;
  }

  try {
    const { data, error } = await client.rpc('security_issue_otp', {
      p_channel: input.channel,
      p_purpose: input.purpose,
      p_destination: destination,
      p_user_id: input.userId ?? null,
    });
    if (error) {
      return { ok: false, message: error.message || copy().otpSendError };
    }
    const row = data as {
      ok?: boolean;
      challengeId?: string;
      channel?: string;
      purpose?: string;
      expiresInSeconds?: number;
      sandboxCode?: string;
      provider?: string;
    };
    if (!row?.ok || !row.challengeId) {
      return { ok: false, message: copy().otpIssueError };
    }

    if (input.channel === 'sms' && row.sandboxCode) {
      await getSmsOtpProvider().sendOtp({
        toE164: destination,
        code: row.sandboxCode,
        purpose: input.purpose as 'phone_verify',
      });
    }

    return {
      ok: true,
      data: {
        challengeId: row.challengeId,
        channel: row.channel ?? input.channel,
        purpose: row.purpose ?? input.purpose,
        expiresInSeconds: row.expiresInSeconds ?? 600,
        sandboxCode: row.sandboxCode,
        provider: row.provider ?? 'sandbox',
      },
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : copy().networkErrorOtpIssue,
    };
  }
}

export async function verifySecurityOtp(input: {
  challengeId: string;
  code: string;
}): Promise<SecurityClientResult<{ purpose: string; channel: string; recoveryReady?: boolean }>> {
  const client = clientOrNull();
  if (!client) {
    return { ok: false, message: copy().authUnavailable };
  }
  const code = input.code.replace(/\D/g, '').slice(0, 6);
  if (code.length !== 6) {
    return { ok: false, message: copy().otpLengthError };
  }
  try {
    const { data, error } = await client.rpc('security_verify_otp', {
      p_challenge_id: input.challengeId,
      p_code: code,
    });
    if (error) {
      return { ok: false, message: error.message || copy().otpInvalidGeneric };
    }
    const row = data as {
      ok?: boolean;
      error?: string;
      purpose?: string;
      channel?: string;
      recoveryReady?: boolean;
    };
    if (!row?.ok) {
      const map = copy().otpErrors as Record<string, string>;
      return {
        ok: false,
        message: map[row?.error ?? ''] ?? copy().otpValidateFallback,
      };
    }
    return {
      ok: true,
      data: {
        purpose: row.purpose ?? '',
        channel: row.channel ?? '',
        recoveryReady: row.recoveryReady,
      },
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : copy().networkErrorOtpValidate,
    };
  }
}

export async function revokeSecuritySession(
  sessionId: string,
): Promise<SecurityClientResult<{ sessionId: string }>> {
  const client = clientOrNull();
  if (!client) {
    return { ok: false, message: copy().authUnavailable };
  }
  try {
    const { data, error } = await client.rpc('security_revoke_session', {
      p_session_id: sessionId,
    });
    if (error) {
      return { ok: false, message: error.message || copy().revokeError };
    }
    const row = data as { ok?: boolean; sessionId?: string; error?: string };
    if (!row?.ok) {
      return { ok: false, message: copy().revokeNotFound };
    }
    return { ok: true, data: { sessionId: row.sessionId ?? sessionId } };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : copy().networkErrorGeneric,
    };
  }
}
