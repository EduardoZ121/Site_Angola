'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { PlatformShell } from '@/modules/shell/components/PlatformShell';
import { getAuthCopy } from '../content';
import { isPublicSupabaseConfigured } from '../lib/public-config';
import { AppSessionContext, type AppSessionData } from './app-session';
import { BrandMark } from './BrandMark';

type GateState = 'loading' | 'ready' | 'anon' | 'config';

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

/**
 * Auth gate for /app + Platform Shell chrome (Fase 3).
 * Session: localStorage (`kuteka-auth`) — static-export safe.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const copy = getAuthCopy();
  const [gate, setGate] = useState<GateState>('loading');
  const [session, setSession] = useState<AppSessionData | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPublicSupabaseConfigured()) {
      setGate('config');
      return;
    }

    let cancelled = false;
    const client = createBrowserClient();

    async function loadSession() {
      setSessionStatus('loading');
      setSessionError(null);
      try {
        const {
          data: { user },
          error: userError,
        } = await client.auth.getUser();
        if (cancelled) return;
        if (userError || !user) {
          setSession(null);
          setSessionStatus('ready');
          return;
        }

        const [{ data: profile, error: profileError }, rolesResult, permissionsResult] =
          await Promise.all([
            client.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
            client.rpc('get_user_role_codes', { p_user_id: user.id }),
            client.rpc('get_user_permission_codes', { p_user_id: user.id }),
          ]);

        if (cancelled) return;

        if (profileError || rolesResult.error || permissionsResult.error) {
          setSessionError(copy.app.loadError);
          setSessionStatus('error');
          setSession({
            email: user.email ?? null,
            displayName: null,
            roles: [],
            permissions: [],
          });
          return;
        }

        setSession({
          email: user.email ?? null,
          displayName: profile?.display_name?.trim() || null,
          roles: asStringArray(rolesResult.data),
          permissions: asStringArray(permissionsResult.data),
        });
        setSessionStatus('ready');
      } catch {
        if (!cancelled) {
          setSessionError(copy.app.loadError);
          setSessionStatus('error');
        }
      }
    }

    void client.auth.getSession().then(({ data: { session: authSession } }) => {
      if (cancelled) return;
      if (!authSession) {
        setGate('anon');
        return;
      }
      setGate('ready');
      void loadSession();
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, authSession) => {
      if (cancelled) return;
      if (!authSession) {
        setGate('anon');
        setSession(null);
        setSessionStatus('ready');
        return;
      }
      setGate('ready');
      void loadSession();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [copy.app.loadError]);

  if (gate === 'loading') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6 py-16">
        <BrandMark tone="dark" href="/app" />
        <Text className="text-slate-600">{copy.common.loading}</Text>
      </div>
    );
  }

  if (gate === 'config') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6 py-16">
        <BrandMark tone="dark" href="/" />
        <Heading level={1}>{copy.app.title}</Heading>
        <Text>{copy.app.configMissing}</Text>
        <Link href="/" className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}>
          {copy.app.ctaLanding}
        </Link>
      </div>
    );
  }

  if (gate === 'anon') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6 py-16">
        <BrandMark tone="dark" href="/" />
        <Heading level={1}>{copy.login.title}</Heading>
        <Text>É necessário entrar para aceder a esta área.</Text>
        <Link
          href="/auth/entrar?next=%2Fapp"
          className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}
        >
          {copy.login.submit}
        </Link>
      </div>
    );
  }

  return (
    <AppSessionContext.Provider value={{ session, status: sessionStatus, error: sessionError }}>
      <PlatformShell session={session} sessionStatus={sessionStatus}>
        {children}
      </PlatformShell>
    </AppSessionContext.Provider>
  );
}
