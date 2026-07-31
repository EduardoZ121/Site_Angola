'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { getAuthCopy } from '../content';

type LoadState = 'loading' | 'ready' | 'error';

/**
 * /app home — loads profile + roles on the client after onboarding (QA-001).
 */
export function AppHomeClient() {
  const copy = getAuthCopy();
  const [state, setState] = useState<LoadState>('loading');
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const client = createBrowserClient();
        const {
          data: { user },
          error: userError,
        } = await client.auth.getUser();
        if (userError || !user) {
          if (!cancelled) {
            setError(copy.common.sessionExpired);
            setState('error');
          }
          return;
        }

        const [{ data: profile, error: profileError }, rolesResult] = await Promise.all([
          client.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
          client.rpc('get_user_role_codes', { p_user_id: user.id }),
        ]);

        if (cancelled) return;

        if (profileError || rolesResult.error) {
          setError(copy.app.loadError);
          setState('error');
          return;
        }

        const roleCodes = Array.isArray(rolesResult.data)
          ? rolesResult.data.filter((r): r is string => typeof r === 'string')
          : [];

        setDisplayName(profile?.display_name ?? user.email ?? null);
        setRoles(roleCodes);
        setState('ready');
      } catch {
        if (!cancelled) {
          setError(copy.app.loadError);
          setState('error');
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [copy.app.loadError, copy.common.sessionExpired]);

  if (state === 'loading') {
    return <Text className="text-slate-600">{copy.common.loading}</Text>;
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col gap-4">
        <Heading level={1}>{copy.app.title}</Heading>
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {error ?? copy.app.loadError}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/auth/entrar?next=%2Fapp"
            className={cn(buttonVariants({ variant: 'primary' }))}
          >
            {copy.login.submit}
          </Link>
          <Link
            href="/auth/onboarding/papeis"
            className={cn(buttonVariants({ variant: 'secondary' }))}
          >
            Voltar aos papéis
          </Link>
        </div>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    client: copy.onboarding.roles.client,
    patrimonial_partner: copy.onboarding.roles.partner,
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Heading level={1}>{copy.app.title}</Heading>
        {displayName ? (
          <Text className="text-lg text-slate-700">
            {copy.app.welcome}, {displayName}
          </Text>
        ) : (
          <Text className="text-lg text-slate-700">{copy.app.welcome}</Text>
        )}
        <Text className="text-slate-600">{copy.app.active}</Text>
        {roles.length > 0 ? (
          <p className="text-sm text-slate-600">
            {copy.app.rolesLabel}:{' '}
            <span className="font-medium text-slate-800">
              {roles.map((r) => roleLabels[r] ?? r).join(' · ')}
            </span>
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <Text className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Em preparação
        </Text>
        <ul className="flex flex-col gap-2 text-slate-700">
          <li className="border-b border-slate-100 py-3">Patrimónios — activar e acompanhar</li>
          <li className="border-b border-slate-100 py-3">Confiança — documentos e verificação</li>
          <li className="border-b border-slate-100 py-3">Habitação — jornada do Cliente</li>
        </ul>
        <Text className="text-sm text-slate-500">{copy.app.stub}</Text>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/" className={cn(buttonVariants({ variant: 'secondary' }))}>
          Voltar à Landing
        </Link>
      </div>
    </div>
  );
}
