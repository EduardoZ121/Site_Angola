'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { ModuleSkeleton } from '@/modules/shell/components/ModuleSkeleton';
import { getAdministracaoCopy } from '../content/pt';
import { fetchPlatformStats, type PlatformStats } from '../services/admin-client';

export function AdminHubClient() {
  const copy = getAdministracaoCopy();
  const { session, status: sessionStatus } = useAppSession();
  const allowed = sessionStatus === 'ready' && !!session?.permissions.includes('admin.panel');

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!allowed) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const result = await fetchPlatformStats();
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setStats(null);
      } else {
        setError(null);
        setStats(result.data);
      }
      setLoading(false);
    }
    if (sessionStatus === 'ready') void load();
    return () => {
      cancelled = true;
    };
  }, [allowed, sessionStatus]);

  if (sessionStatus === 'loading') return <ModuleSkeleton rows={3} />;

  if (!allowed) {
    return (
      <div className="flex flex-col gap-4">
        <Heading level={1}>{copy.title}</Heading>
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {copy.forbidden}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            Operação
          </p>
          <Heading level={1}>{copy.title}</Heading>
          <Text className="text-slate-600">{copy.subtitle}</Text>
          <Badge variant="brand" className="w-fit">
            {copy.permissionBadge}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/confianca/revisao"
            className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
          >
            {copy.trustReview}
          </Link>
          <Link
            href="/app/admin/utilizadores"
            className={cn(buttonVariants({ variant: 'primary' }), 'w-fit shrink-0')}
          >
            {copy.users}
          </Link>
        </div>
      </header>

      <p className="text-sm text-slate-500">{copy.mvpNote}</p>

      <section className="flex flex-col gap-3" aria-labelledby="stats-heading">
        <div className="flex flex-col gap-1">
          <h2 id="stats-heading" className="text-sm font-semibold text-slate-800">
            {copy.statsTitle}
          </h2>
          <Text className="text-sm text-slate-500">{copy.statsHint}</Text>
        </div>
        {loading ? <ModuleSkeleton rows={2} /> : null}
        {error ? (
          <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {error}
          </div>
        ) : null}
        {!loading && !error && stats ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ['profiles', stats.profiles],
                ['properties', stats.properties_active],
                ['assignments', stats.agent_assignments_active],
                ['agents', stats.roles_certified_agent],
              ] as const
            ).map(([key, value]) => (
              <li key={key} className="rounded-kuteka border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {copy.stats[key]}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
              </li>
            ))}
          </ul>
        ) : null}
        {!loading && !error && !stats ? (
          <EmptyState title={copy.statsTitle} description={copy.loadError} />
        ) : null}
      </section>
    </div>
  );
}
