import type { SelfServeRoleCode } from '@kuteka/validation';
import { createBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '../lib/supabase-config';
import { getAuthCopy } from '../content';

export type AuthClientResult<T = void> =
  | { ok: true; data: T }
  | {
      ok: false;
      message: string;
      code?: 'duplicate_email' | 'generic' | 'config' | 'network' | 'rate_limited';
    };

const copy = getAuthCopy();

function configError(): AuthClientResult<never> {
  return {
    ok: false,
    code: 'config',
    message: copy.common.configMissing,
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
    return { ok: false, code: 'rate_limited', message: copy.common.rateLimited };
  }
  if (
    /already|registered|exists|user_already/i.test(msg) ||
    code === 'user_already_exists' ||
    error.status === 422
  ) {
    return {
      ok: false,
      code: 'duplicate_email',
      message: `${copy.register.duplicate.title} ${copy.register.duplicate.body}`,
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
    return { ok: false, code: 'rate_limited', message: copy.common.rateLimited };
  }
  if (/fetch|network|Failed to fetch|Load failed/i.test(msg)) {
    return { ok: false, code: 'network', message: copy.common.networkError };
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
      return mapAuthError(error, copy.common.networkError);
    }

    // Supabase may return empty identities for existing email (anti-enumeration on some projects)
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        ok: false,
        code: 'duplicate_email',
        message: `${copy.register.duplicate.title} ${copy.register.duplicate.body}`,
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
    return mapUnknownError(err, `${copy.common.networkError} ${copy.common.nextStepRetry}`);
  }
}

export async function signIn(input: {
  email: string;
  password: string;
}): Promise<AuthClientResult> {
  const client = getClient();
  if (!client) return configError();

  try {
    const { error } = await client.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      // R6 — generic login message
      return { ok: false, code: 'generic', message: copy.login.errorGeneric };
    }
    return { ok: true, data: undefined };
  } catch (err) {
    return mapUnknownError(err, copy.login.errorGeneric);
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
        message: `${copy.common.networkError} ${copy.common.nextStepRetry}`,
      };
    }
    return { ok: true, data: undefined };
  } catch (err) {
    return mapUnknownError(err, copy.common.networkError);
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
    return { ok: false, code: 'network', message: copy.common.networkError };
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
        message: `Não foi possível actualizar a password. ${copy.common.nextStepRetry}`,
      };
    }
    return { ok: true, data: undefined };
  } catch (err) {
    return mapUnknownError(err, copy.common.networkError);
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
      return mapAuthError(error, `Não foi possível reenviar o email. ${copy.common.nextStepRetry}`);
    }
    return { ok: true, data: undefined };
  } catch (err) {
    return mapUnknownError(err, copy.common.networkError);
  }
}

export async function activateSelfServeRoles(
  roleCodes: SelfServeRoleCode[],
): Promise<AuthClientResult> {
  const client = getClient();
  if (!client) return configError();

  try {
    const { error } = await client.rpc('activate_self_serve_roles', {
      p_role_codes: roleCodes,
    });
    if (error) {
      return {
        ok: false,
        code: 'generic',
        message: `Não foi possível activar os papéis. ${error.message || copy.common.nextStepRetry}`,
      };
    }
    return { ok: true, data: undefined };
  } catch (err) {
    return mapUnknownError(err, copy.common.networkError);
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
        message: `Não foi possível guardar o nome. ${copy.common.nextStepRetry}`,
      };
    }
    return { ok: true, data: undefined };
  } catch (err) {
    return mapUnknownError(err, copy.common.networkError);
  }
}
