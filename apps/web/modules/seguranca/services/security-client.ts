'use client';

import { createBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/modules/authentication/lib/supabase-config';
import { getSmsOtpProvider, normalizeAngolaPhone } from '../providers/sms-otp';
import type { SecurityCenterSnapshot } from '../lib/security-center';

export type SecurityClientResult<T = void> = { ok: true; data: T } | { ok: false; message: string };

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
    return { ok: false, message: 'Autenticação indisponível neste ambiente.' };
  }
  try {
    const { data, error } = await client.rpc('get_security_center_snapshot');
    if (error) {
      return {
        ok: false,
        message: error.message || 'Não foi possível carregar o Centro de Segurança.',
      };
    }
    return { ok: true, data: data as SecurityCenterSnapshot };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Erro de rede ao carregar segurança.',
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
    return { ok: false, message: 'Autenticação indisponível neste ambiente.' };
  }

  let destination = input.destination.trim();
  if (input.channel === 'sms') {
    const normalized = normalizeAngolaPhone(destination);
    if (!normalized) {
      return { ok: false, message: 'Indique um número de telefone válido (ex.: +2449XXXXXXXX).' };
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
      return { ok: false, message: error.message || 'Não foi possível enviar o código.' };
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
      return { ok: false, message: 'Não foi possível emitir o código OTP.' };
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
      message: err instanceof Error ? err.message : 'Erro de rede ao emitir OTP.',
    };
  }
}

export async function verifySecurityOtp(input: {
  challengeId: string;
  code: string;
}): Promise<SecurityClientResult<{ purpose: string; channel: string; recoveryReady?: boolean }>> {
  const client = clientOrNull();
  if (!client) {
    return { ok: false, message: 'Autenticação indisponível neste ambiente.' };
  }
  const code = input.code.replace(/\D/g, '').slice(0, 6);
  if (code.length !== 6) {
    return { ok: false, message: 'Introduza o código de 6 dígitos.' };
  }
  try {
    const { data, error } = await client.rpc('security_verify_otp', {
      p_challenge_id: input.challengeId,
      p_code: code,
    });
    if (error) {
      return { ok: false, message: error.message || 'Código inválido.' };
    }
    const row = data as {
      ok?: boolean;
      error?: string;
      purpose?: string;
      channel?: string;
      recoveryReady?: boolean;
    };
    if (!row?.ok) {
      const map: Record<string, string> = {
        invalid_code: 'Código incorrecto. Tente novamente.',
        expired: 'O código expirou. Peça um novo.',
        already_used: 'Este código já foi utilizado.',
        too_many_attempts: 'Demasiadas tentativas. Peça um novo código.',
        challenge_not_found: 'Desafio não encontrado. Peça um novo código.',
        forbidden: 'Não tem permissão para validar este código.',
      };
      return {
        ok: false,
        message: map[row?.error ?? ''] ?? 'Não foi possível validar o código.',
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
      message: err instanceof Error ? err.message : 'Erro de rede ao validar OTP.',
    };
  }
}

export async function revokeSecuritySession(
  sessionId: string,
): Promise<SecurityClientResult<{ sessionId: string }>> {
  const client = clientOrNull();
  if (!client) {
    return { ok: false, message: 'Autenticação indisponível neste ambiente.' };
  }
  try {
    const { data, error } = await client.rpc('security_revoke_session', {
      p_session_id: sessionId,
    });
    if (error) {
      return { ok: false, message: error.message || 'Não foi possível terminar a sessão.' };
    }
    const row = data as { ok?: boolean; sessionId?: string; error?: string };
    if (!row?.ok) {
      return { ok: false, message: 'Sessão não encontrada ou já terminada.' };
    }
    return { ok: true, data: { sessionId: row.sessionId ?? sessionId } };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Erro de rede.',
    };
  }
}
