'use client';

import { useEffect, useState } from 'react';
import { Heading, Text } from '@kuteka/ui';
import { canAccessAdminPanel, type AuthorizationContext } from '@kuteka/auth';
import { fetchAuthorizationContext } from '@kuteka/database';
import { createBrowserClient } from '@/lib/supabase/client';
import { getAuthCopy } from '../content';

type State = 'loading' | 'allowed' | 'forbidden' | 'error';

/** Client admin gate — static-export safe (QA-001 pattern). */
export function AdminPanelClient() {
  const copy = getAuthCopy();
  const [state, setState] = useState<State>('loading');

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
          if (!cancelled) setState('forbidden');
          return;
        }

        const ctx: AuthorizationContext = await fetchAuthorizationContext(
          client,
          user.id,
          user.email ?? null,
        );
        if (cancelled) return;
        setState(canAccessAdminPanel(ctx) ? 'allowed' : 'forbidden');
      } catch {
        if (!cancelled) setState('error');
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === 'loading') {
    return <Text className="text-slate-600">{copy.common.loading}</Text>;
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col gap-4">
        <Heading level={1}>{copy.app.adminTitle}</Heading>
        <Text>{copy.app.loadError}</Text>
      </div>
    );
  }

  if (state === 'forbidden') {
    return (
      <div className="flex flex-col gap-4">
        <Heading level={1}>{copy.app.adminTitle}</Heading>
        <Text>{copy.app.adminForbidden}</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Heading level={1}>{copy.app.adminTitle}</Heading>
      <Text className="text-sm text-slate-500">Permissão: admin.panel</Text>
      <Text>{copy.app.adminStub}</Text>
    </div>
  );
}
