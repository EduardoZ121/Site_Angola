'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { PlatformShell } from '@/modules/shell/components/PlatformShell';
import { getAuthCopy } from '../content';
import { isPublicSupabaseConfigured } from '../lib/public-config';
import { AppSessionContext, type AppSessionData } from './app-session';
import { BrandMark } from './BrandMark';

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

/**
 * Auth gate for /app + Platform Shell.
 * Stability rule: never flip sessionStatus back to loading after first ready
 * (TOKEN_REFRESHED must not remount module trees / skeletons).
 * Session cache: restore profile/permissions on first paint to avoid nav/Forbidden flash.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const copy = getAuthCopy();
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
            client.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
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
          };
          setSession(partial);
          writeSessionCache(null);
          sessionReadyOnce.current = true;
          return;
        }

        const next: AppSessionData = {
          email: user.email ?? null,
          displayName: profile?.display_name?.trim() || null,
          roles: asStringArray(rolesResult.data),
          permissions: asStringArray(permissionsResult.data),
        };
        setSession(next);
        writeSessionCache(next);
        setSessionError(null);
        setSessionStatus('ready');
        sessionReadyOnce.current = true;
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

      // INITIAL_SESSION duplicates getSession — ignore after first resolve.
      // TOKEN_REFRESHED / USER_UPDATED must refresh silently (no skeleton).
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
  }, [copy.app.loadError]);

  if (gate === 'config') {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-16">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-45"
          style={{ backgroundImage: "url('/images/hero.jpg')" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/70"
        />
        <div className="relative z-10 flex max-w-lg flex-col gap-4 rounded-kuteka border border-white/15 bg-white/95 p-6 shadow-xl">
          <BrandMark tone="dark" href="/" size="md" />
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
          style={{ backgroundImage: "url('/images/hero.jpg')" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/70"
        />
        <div className="relative z-10 flex max-w-lg flex-col gap-4 rounded-kuteka border border-white/15 bg-white/95 p-6 shadow-xl">
          <BrandMark tone="dark" href="/" size="md" />
          <Heading level={1}>{copy.login.title}</Heading>
          <Text>É necessário entrar para aceder a esta área.</Text>
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

  // booting OR ready — keep PlatformShell mounted (no boot flash swap).
  return (
    <AppSessionContext.Provider value={{ session, status: sessionStatus, error: sessionError }}>
      <PlatformShell session={session} sessionStatus={sessionStatus}>
        {children}
      </PlatformShell>
    </AppSessionContext.Provider>
  );
}
