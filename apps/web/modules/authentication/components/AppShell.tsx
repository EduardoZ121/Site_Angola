'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { getAuthCopy } from '../content';
import { isPublicSupabaseConfigured } from '../lib/public-config';
import { BrandMark } from './BrandMark';

type GateState = 'loading' | 'ready' | 'anon' | 'config';

/**
 * Client auth gate for /app on static hosts.
 * Server cookie checks are unreliable in Next static export (QA-001).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const copy = getAuthCopy();
  const [state, setState] = useState<GateState>('loading');

  useEffect(() => {
    if (!isPublicSupabaseConfigured()) {
      setState('config');
      return;
    }

    let cancelled = false;
    const client = createBrowserClient();

    void client.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) setState(session ? 'ready' : 'anon');
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setState(session ? 'ready' : 'anon');
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6 py-16">
        <BrandMark tone="dark" />
        <Text className="text-slate-600">{copy.common.loading}</Text>
      </div>
    );
  }

  if (state === 'config') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6 py-16">
        <BrandMark tone="dark" />
        <Heading level={1}>{copy.app.title}</Heading>
        <Text>{copy.app.configMissing}</Text>
        <Link href="/" className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}>
          Voltar à Landing
        </Link>
      </div>
    );
  }

  if (state === 'anon') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6 py-16">
        <BrandMark tone="dark" />
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4">
        <BrandMark href="/app" tone="dark" />
        <Link href="/auth/sair" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
          {copy.logout.action}
        </Link>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-12">{children}</main>
    </div>
  );
}
