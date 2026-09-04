'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { LocaleProvider, useLocale } from '@/modules/i18n/LocaleProvider';
import { normalizeLocale, type AppLocale } from '@/modules/i18n/types';
import { PlatformShell } from '@/modules/shell/components/PlatformShell';
import { RoleExperienceProvider } from '@/modules/shell/components/RoleExperienceProvider';
import { useRouter } from 'next/navigation';
import { getAuthCopy } from '../content';
import { applyDestinationGate, resolveEmailVerified } from '../lib/destination-gate';
import { isPublicSupabaseConfigured } from '../lib/public-config';
import { AppSessionContext, type AppSessionData } from './app-session';
import { BrandMark } from './BrandMark';

function normalizeLocaleSafe(value: string): AppLocale {
  return normalizeLocale(value);
}

type GateState = 'booting' | 'ready' | 'anon' | 'config';

const SESSION_CACHE_KEY = 'kuteka-session-cache';

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

/** Sync peek — avoids full-screen boot flash when local session exists. */
function peekStoredAuthSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem('kuteka-auth');
    if (!raw) return false;
    const parsed = JSON.parse(raw) as {
      access_token?: string;
      user?: unknown;
      currentSession?: { access_token?: string; user?: unknown };
    };
    return Boolean(
      parsed?.access_token ||
      parsed?.user ||
      parsed?.currentSession?.access_token ||
      parsed?.currentSession?.user,
    );
  } catch {
    return false;
  }
}

function readSessionCache(): AppSessionData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppSessionData;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      email: typeof parsed.email === 'string' ? parsed.email : null,
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName : null,
      roles: asStringArray(parsed.roles),
      permissions: asStringArray(parsed.permissions),
      locale: typeof parsed.locale === 'string' ? parsed.locale : null,
      emailVerified: typeof parsed.emailVerified === 'boolean' ? parsed.emailVerified : undefined,
    };
  } catch {
    return null;
  }
}

function writeSessionCache(data: AppSessionData | null) {
  if (typeof window === 'undefined') return;
  try {
    if (!data) {
      window.sessionStorage.removeItem(SESSION_CACHE_KEY);
      return;
    }
    window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota */
  }
}

function AppShellInner({ children }: { children: ReactNode }) {
  const { locale, setLocale } = useLocale();
  const copy = getAuthCopy(locale);
  const router = useRouter();
  const [authRedirect, setAuthRedirect] = useState<string | null>(null);
  const cachedRef = useRef<AppSessionData | null | undefined>(undefined);
  if (cachedRef.current === undefined) {
    cachedRef.current =
      typeof window !== 'undefined' && peekStoredAuthSession() ? readSessionCache() : null;
  }
  const cached = cachedRef.current;

  const [gate, setGate] = useState<GateState>(() =>
    typeof window !== 'undefined' && peekStoredAuthSession() ? 'ready' : 'booting',
  );
  const [session, setSession] = useState<AppSessionData | null>(() => cached);
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'ready' | 'error'>(() =>
    cached ? 'ready' : 'loading',
  );
  const [sessionError, setSessionError] = useState<string | null>(null);
  const sessionReadyOnce = useRef(Boolean(cached));
  const loadGeneration = useRef(0);

  useEffect(() => {
    if (!isPublicSupabaseConfigured()) {
      setGate('config');
      return;
    }

    let cancelled = false;
    const client = createBrowserClient();

    async function loadSession(opts?: { silent?: boolean }) {
      const gen = ++loadGeneration.current;
      const silent = Boolean(opts?.silent) || sessionReadyOnce.current;

      if (!silent) {
        setSessionStatus('loading');
        setSessionError(null);
      }

      try {
        const {
          data: { user },
          error: userError,
        } = await client.auth.getUser();
        if (cancelled || gen !== loadGeneration.current) return;

        if (userError || !user) {
          setSession(null);
          writeSessionCache(null);
          setSessionStatus('ready');
          sessionReadyOnce.current = true;
          return;
        }

        const [{ data: profile, error: profileError }, rolesResult, permissionsResult] =
          await Promise.all([
            client
              .from('profiles')
              .select('display_name, locale, email_verified_at')
              .eq('id', user.id)
              .maybeSingle(),
            client.rpc('get_user_role_codes', { p_user_id: user.id }),
            client.rpc('get_user_permission_codes', { p_user_id: user.id }),
          ]);

        if (cancelled || gen !== loadGeneration.current) return;

        if (profileError || rolesResult.error || permissionsResult.error) {
          setSessionError(copy.app.loadError);
          setSessionStatus('error');
          const partial: AppSessionData = {
            email: user.email ?? null,
            displayName: null,
            roles: [],
            permissions: [],
            locale: null,
          };
          setSession(partial);
          writeSessionCache(null);
          sessionReadyOnce.current = true;
          return;
        }

        const emailVerified = resolveEmailVerified({
          authConfirmedAt: user.email_confirmed_at,
          profileVerifiedAt:
            profile && 'email_verified_at' in profile
              ? (profile.email_verified_at as string | null)
              : null,
        });
        const next: AppSessionData = {
          email: user.email ?? null,
          displayName: profile?.display_name?.trim() || null,
          roles: asStringArray(rolesResult.data),
          permissions: asStringArray(permissionsResult.data),
          locale: typeof profile?.locale === 'string' ? profile.locale : null,
          emailVerified,
        };
        const dest = applyDestinationGate({
          hasSession: true,
          emailVerified,
          roleCodes: next.roles,
        });
        setAuthRedirect(dest.startsWith('/auth') ? dest : null);
        setSession(next);
        writeSessionCache(next);
        setSessionError(null);
        setSessionStatus('ready');
        sessionReadyOnce.current = true;
        // Only seed from profile when the user has no explicit local preference yet.
        try {
          const stored = window.localStorage.getItem('kuteka-locale');
          if (!stored && next.locale) {
            setLocale(normalizeLocaleSafe(next.locale));
          }
        } catch {
          /* ignore */
        }
      } catch {
        if (!cancelled && gen === loadGeneration.current) {
          setSessionError(copy.app.loadError);
          setSessionStatus('error');
          sessionReadyOnce.current = true;
        }
      }
    }

    void client.auth.getSession().then(({ data: { session: authSession } }) => {
      if (cancelled) return;
      if (!authSession) {
        setGate('anon');
        setSession(null);
        writeSessionCache(null);
        setSessionStatus('ready');
        sessionReadyOnce.current = true;
        return;
      }
      setGate('ready');
      void loadSession({ silent: sessionReadyOnce.current });
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, authSession) => {
      if (cancelled) return;

      if (!authSession) {
        setGate('anon');
        setSession(null);
        writeSessionCache(null);
        setSessionStatus('ready');
        sessionReadyOnce.current = true;
        return;
      }

      setGate('ready');

      if (event === 'INITIAL_SESSION' && sessionReadyOnce.current) {
        return;
      }
      void loadSession({
        silent: sessionReadyOnce.current || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED',
      });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [copy.app.loadError, setLocale]);

  useEffect(() => {
    if (authRedirect) router.replace(authRedirect);
  }, [authRedirect, router]);

  if (gate === 'config') {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-16">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-45"
          style={{ backgroundImage: "url('/images/hero-app.jpg')" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/70"
        />
        <div className="relative z-10 flex max-w-lg flex-col gap-4 rounded-kuteka border border-white/15 bg-white/95 p-6 shadow-xl">
          <BrandMark tone="dark" href="/" size="md" variant="inline" />
          <Heading level={1}>{copy.app.title}</Heading>
          <Text>{copy.app.configMissing}</Text>
          <Link href="/" className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}>
            {copy.app.ctaLanding}
          </Link>
        </div>
      </div>
    );
  }

  if (gate === 'anon') {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-16">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{ backgroundImage: "url('/images/hero-app.jpg')" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/70"
        />
        <div className="relative z-10 flex max-w-lg flex-col gap-4 rounded-kuteka border border-white/15 bg-white/95 p-6 shadow-xl">
          <BrandMark tone="dark" href="/" size="md" variant="inline" />
          <Heading level={1}>{copy.login.title}</Heading>
          <Text>{copy.app.loginRequired}</Text>
          <Link
            href="/auth/entrar?next=%2Fapp"
            className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}
          >
            {copy.login.submit}
          </Link>
        </div>
      </div>
    );
  }

  if (authRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <p className="text-sm text-slate-600">{copy.app.continuing}</p>
      </div>
    );
  }

  return (
    <AppSessionContext.Provider value={{ session, status: sessionStatus, error: sessionError }}>
      <RoleExperienceProvider roles={session?.roles ?? []} permissions={session?.permissions ?? []}>
        <PlatformShell session={session} sessionStatus={sessionStatus}>
          {children}
        </PlatformShell>
      </RoleExperienceProvider>
    </AppSessionContext.Provider>
  );
}

/**
 * Auth gate for /app + Platform Shell.
 * LocaleProvider wraps everything so anon/config/error screens follow the selected language.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const cached =
    typeof window !== 'undefined' && peekStoredAuthSession() ? readSessionCache() : null;

  return (
    <LocaleProvider profileLocale={cached?.locale ?? null}>
      <AppShellSyncedProfile>{children}</AppShellSyncedProfile>
    </LocaleProvider>
  );
}

/** Re-seed LocaleProvider when session profile locale arrives (via key remount avoided — use effect in provider). */
function AppShellSyncedProfile({ children }: { children: ReactNode }) {
  return <AppShellInner>{children}</AppShellInner>;
}
