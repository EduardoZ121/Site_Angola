import type { SelfServeRoleCode } from '@kuteka/validation';
import { createBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '../lib/supabase-config';
import { getAuthCopy, resolveAuthLocale } from '../content';

export type AuthClientResult<T = void> =
  | { ok: true; data: T }
  | {
      ok: false;
      message: string;
      code?: 'duplicate_email' | 'generic' | 'config' | 'network' | 'rate_limited';
    };

function authCopy() {
  return getAuthCopy(resolveAuthLocale());
}

function configError(): AuthClientResult<never> {
  return {
    ok: false,
    code: 'config',
    message: authCopy().common.configMissing,
  };
}

function isRateLimitMessage(msg: string, status?: number): boolean {
  const m = msg.toLowerCase();
  return (
    status === 429 ||
    m.includes('rate limit') ||
    m.includes('over_email') ||
    m.includes('email rate') ||
    m.includes('too many requests') ||
    m.includes('security purposes')
  );
}

function mapAuthError(
  error: { message?: string; status?: number; code?: string },
  fallback: string,
): AuthClientResult<never> {
  const msg = error.message ?? '';
  const code = error.code ?? '';
  if (isRateLimitMessage(`${msg} ${code}`, error.status)) {
    return { ok: false, code: 'rate_limited', message: authCopy().common.rateLimited };
  }
  if (
    /already|registered|exists|user_already/i.test(msg) ||
    code === 'user_already_exists' ||
    error.status === 422
  ) {
    return {
      ok: false,
      code: 'duplicate_email',
      message: `${authCopy().register.duplicate.title} ${authCopy().register.duplicate.body}`,
    };
  }
  return {
    ok: false,
    code: 'generic',
    message: fallback,
  };
}

function mapUnknownError(err: unknown, fallback: string): AuthClientResult<never> {
  const msg = err instanceof Error ? err.message : String(err);
  if (isRateLimitMessage(msg)) {
    return { ok: false, code: 'rate_limited', message: authCopy().common.rateLimited };
  }
  if (/fetch|network|Failed to fetch|Load failed/i.test(msg)) {
    return { ok: false, code: 'network', message: authCopy().common.networkError };
  }
  return { ok: false, code: 'generic', message: fallback };
}

function getClient() {
  if (!isSupabaseConfigured()) return null;
  try {
    return createBrowserClient();
  } catch {
    return null;
  }
}

export async function signUp(input: {
  email: string;
  password: string;
  emailRedirectTo?: string;
}): Promise<AuthClientResult<{ needsEmailVerification: boolean; hasSession: boolean }>> {
  const client = getClient();
  if (!client) return configError();

  try {
    const { data, error } = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: input.emailRedirectTo,
      },
    });

    if (error) {
      return mapAuthError(error, authCopy().common.networkError);
    }

    // Supabase may return empty identities for existing email (anti-enumeration on some projects)
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        ok: false,
        code: 'duplicate_email',
        message: `${authCopy().register.duplicate.title} ${authCopy().register.duplicate.body}`,
      };
    }

    const confirmed = Boolean(data.user?.email_confirmed_at);
    const hasSession = Boolean(data.session);
    // With mailer_autoconfirm, email may be confirmed even if session is omitted.
    return {
      ok: true,
      data: {
        needsEmailVerification: !hasSession && !confirmed,
        hasSession,
      },
    };
  } catch (err) {
    return mapUnknownError(
      err,
      `${authCopy().common.networkError} ${authCopy().common.nextStepRetry}`,
    );
  }
}

export async function signIn(input: {
  email: string;
  password: string;
}): Promise<AuthClientResult> {
  const client = getClient();
  if (!client) return configError();

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      // R6 — generic login message
      return { ok: false, code: 'generic', message: authCopy().login.errorGeneric };
    }

    // Ensure session is persisted before the next navigation (static hosts).
    if (!data.session) {
      const { data: again } = await client.auth.getSession();
      if (!again.session) {
        return { ok: false, code: 'generic', message: authCopy().common.sessionExpired };
      }
    }
    return { ok: true, data: undefined };
  } catch (err) {
    return mapUnknownError(err, authCopy().login.errorGeneric);
  }
}

export async function signOut(): Promise<AuthClientResult> {
  const client = getClient();
  if (!client) return configError();

  try {
    const { error } = await client.auth.signOut();
    if (error) {
      return {
        ok: false,
        code: 'generic',
        message: `${authCopy().common.networkError} ${authCopy().common.nextStepRetry}`,
      };
    }
    return { ok: true, data: undefined };
  } catch (err) {
    return mapUnknownError(err, authCopy().common.networkError);
  }
}

export async function resetPasswordForEmail(input: {
  email: string;
  redirectTo?: string;
}): Promise<AuthClientResult> {
  const client = getClient();
  if (!client) return configError();

  try {
    const { error } = await client.auth.resetPasswordForEmail(input.email, {
      redirectTo: input.redirectTo,
    });
    // R6 — always success-shaped message to the UI layer
    if (error) {
      return { ok: true, data: undefined };
    }
    return { ok: true, data: undefined };
  } catch {
    // Network: still avoid enumeration; prefer guided retry
    return { ok: false, code: 'network', message: authCopy().common.networkError };
  }
}

export async function updatePassword(input: { password: string }): Promise<AuthClientResult> {
  const client = getClient();
  if (!client) return configError();

  try {
    const { error } = await client.auth.updateUser({ password: input.password });
    if (error) {
      return {
        ok: false,
        code: 'generic',
        message: `Não foi possível actualizar a password. ${authCopy().common.nextStepRetry}`,
      };
    }
    return { ok: true, data: undefined };
  } catch (err) {
    return mapUnknownError(err, authCopy().common.networkError);
  }
}

export async function resendVerification(input: { email: string }): Promise<AuthClientResult> {
  const client = getClient();
  if (!client) return configError();

  try {
    const { error } = await client.auth.resend({
      type: 'signup',
      email: input.email,
    });
    if (error) {
      return mapAuthError(
        error,
        `Não foi possível reenviar o email. ${authCopy().common.nextStepRetry}`,
      );
    }
    return { ok: true, data: undefined };
  } catch (err) {
    return mapUnknownError(err, authCopy().common.networkError);
  }
}

/** Dual path: Supabase email OTP (link companion) + Kuteka security_issue_otp sandbox/app code. */
export async function issueEmailVerificationOtp(input: {
  email: string;
}): Promise<
  AuthClientResult<{ challengeId?: string; sandboxCode?: string; supabaseOtpRequested: boolean }>
> {
  const client = getClient();
  if (!client) return configError();

  let supabaseOtpRequested = false;
  try {
    const { error: resendError } = await client.auth.resend({
      type: 'signup',
      email: input.email,
    });
    supabaseOtpRequested = !resendError;
  } catch {
    supabaseOtpRequested = false;
  }

  try {
    const {
      data: { user },
    } = await client.auth.getUser();
    const { data, error } = await client.rpc('security_issue_otp', {
      p_channel: 'email',
      p_purpose: 'email_verify',
      p_destination: input.email.trim().toLowerCase(),
      p_user_id: user?.id ?? null,
    });
    if (error) {
      if (supabaseOtpRequested) {
        return { ok: true, data: { supabaseOtpRequested: true } };
      }
      return mapAuthError(
        error,
        `Não foi possível enviar o código. ${authCopy().common.nextStepRetry}`,
      );
    }
    const row = data as { ok?: boolean; challengeId?: string; sandboxCode?: string };
    return {
      ok: true,
      data: {
        challengeId: row?.challengeId,
        sandboxCode: row?.sandboxCode,
        supabaseOtpRequested,
      },
    };
  } catch (err) {
    if (supabaseOtpRequested) {
      return { ok: true, data: { supabaseOtpRequested: true } };
    }
    return mapUnknownError(err, authCopy().common.networkError);
  }
}

/**
 * Preferential Method B: 6-digit OTP in-app.
 * Tries Supabase Auth verifyOtp first, then Kuteka security_verify_otp challenge.
 */
export async function verifyEmailOtpCode(input: {
  email: string;
  code: string;
  challengeId?: string | null;
}): Promise<AuthClientResult<{ via: 'supabase' | 'kuteka' }>> {
  const client = getClient();
  if (!client) return configError();

  const token = input.code.replace(/\D/g, '').slice(0, 6);
  if (token.length !== 6) {
    return { ok: false, code: 'generic', message: 'Introduza o código de 6 dígitos.' };
  }

  try {
    const { error: supabaseError } = await client.auth.verifyOtp({
      email: input.email.trim().toLowerCase(),
      token,
      type: 'signup',
    });
    if (!supabaseError) {
      return { ok: true, data: { via: 'supabase' } };
    }
  } catch {
    // fall through to Kuteka challenge
  }

  if (input.challengeId) {
    try {
      const { data, error } = await client.rpc('security_verify_otp', {
        p_challenge_id: input.challengeId,
        p_code: token,
      });
      if (error) {
        return {
          ok: false,
          code: 'generic',
          message: `Código inválido. ${authCopy().common.nextStepRetry}`,
        };
      }
      const row = data as { ok?: boolean; error?: string };
      if (row?.ok) {
        return { ok: true, data: { via: 'kuteka' } };
      }
      return {
        ok: false,
        code: 'generic',
        message:
          row?.error === 'expired'
            ? 'O código expirou. Peça um novo.'
            : 'Código incorrecto. Tente novamente.',
      };
    } catch (err) {
      return mapUnknownError(err, authCopy().common.networkError);
    }
  }

  return {
    ok: false,
    code: 'generic',
    message: 'Código incorrecto ou expirado. Reenvie o email e tente novamente.',
  };
}

export async function activateSelfServeRoles(
  roleCodes: SelfServeRoleCode[],
): Promise<AuthClientResult> {
  const client = getClient();
  if (!client) return configError();

  try {
    const {
      data: { session },
      error: sessionError,
    } = await client.auth.getSession();
    if (sessionError || !session) {
      return { ok: false, code: 'generic', message: authCopy().common.sessionExpired };
    }

    const { error } = await client.rpc('activate_self_serve_roles', {
      p_role_codes: roleCodes,
    });
    if (error) {
      const m = (error.message || '').toLowerCase();
      if (m.includes('authentication required') || m.includes('jwt') || error.code === 'PGRST301') {
        return { ok: false, code: 'generic', message: authCopy().common.sessionExpired };
      }
      return {
        ok: false,
        code: 'generic',
        message: `Não foi possível activar os papéis. ${error.message || authCopy().common.nextStepRetry}`,
      };
    }
    return { ok: true, data: undefined };
  } catch (err) {
    return mapUnknownError(err, authCopy().common.networkError);
  }
}

export async function updateDisplayName(displayName: string): Promise<AuthClientResult> {
  const client = getClient();
  if (!client) return configError();

  try {
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user) {
      return {
        ok: false,
        code: 'generic',
        message: `Sessão inválida. Entre novamente para continuar.`,
      };
    }
    const { error } = await client
      .from('profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', user.id);
    if (error) {
      return {
        ok: false,
        code: 'generic',
        message: `Não foi possível guardar o nome. ${authCopy().common.nextStepRetry}`,
      };
    }
    return { ok: true, data: undefined };
  } catch (err) {
    return mapUnknownError(err, authCopy().common.networkError);
  }
}
