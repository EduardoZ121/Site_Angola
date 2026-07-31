'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heading, Text, Badge, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { getAuthCopy } from '../content';
import { isPublicSupabaseConfigured } from '../lib/public-config';
import { AppSessionContext, type AppSessionData, roleLabelPt } from './app-session';
import { BrandMark } from './BrandMark';

type GateState = 'loading' | 'ready' | 'anon' | 'config';

/**
 * Client auth gate + chrome for /app on static hosts (QA-001, QA-008, QA-014).
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

        const [{ data: profile, error: profileError }, rolesResult] = await Promise.all([
          client.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
          client.rpc('get_user_role_codes', { p_user_id: user.id }),
        ]);

        if (cancelled) return;

        if (profileError || rolesResult.error) {
          setSessionError(copy.app.loadError);
          setSessionStatus('error');
          setSession({
            email: user.email ?? null,
            displayName: null,
            roles: [],
          });
          return;
        }

        const roleCodes = Array.isArray(rolesResult.data)
          ? rolesResult.data.filter((r): r is string => typeof r === 'string')
          : [];

        setSession({
          email: user.email ?? null,
          displayName: profile?.display_name?.trim() || null,
          roles: roleCodes,
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

  const roleLabels: Record<string, string> = {
    client: copy.onboarding.roles.client,
    patrimonial_partner: copy.onboarding.roles.partner,
  };

  const headerName = session?.displayName || session?.email || copy.app.userFallback;
  const roleBadges = session?.roles ?? [];

  return (
    <AppSessionContext.Provider value={{ session, status: sessionStatus, error: sessionError }}>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-2">
              <BrandMark href="/app" tone="dark" />
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
                <p className="truncate text-sm font-medium text-slate-800">{headerName}</p>
                {roleBadges.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5" aria-label={copy.app.rolesLabel}>
                    {roleBadges.map((code) => (
                      <Badge key={code} variant="brand">
                        {roleLabelPt(code, roleLabels)}
                      </Badge>
                    ))}
                  </div>
                ) : sessionStatus === 'ready' ? (
                  <span className="text-xs text-slate-500">{copy.app.noRoles}</span>
                ) : null}
              </div>
            </div>
            <Link
              href="/auth/sair"
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'self-start sm:self-center',
              )}
            >
              {copy.logout.action}
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-10 sm:py-12">{children}</main>
      </div>
    </AppSessionContext.Provider>
  );
}
