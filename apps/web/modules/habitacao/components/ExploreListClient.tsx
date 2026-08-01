'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { ModuleSkeleton } from '@/modules/shell/components/ModuleSkeleton';
import { getHabitacaoCopy } from '../content/pt';
import {
  exploreActiveProperties,
  getClientPreferences,
  type HousingPropertyRow,
} from '../services/housing-client';

export function ExploreListClient() {
  const copy = getHabitacaoCopy();
  const { session, status: sessionStatus } = useAppSession();
  const canExplore = session?.permissions.includes('housing.explore') ?? false;
  const [rows, setRows] = useState<HousingPropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!canExplore) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const prefs = await getClientPreferences();
      if (cancelled) return;
      const filters =
        prefs.ok && prefs.data
          ? {
              purpose: prefs.data.purpose,
              province: prefs.data.province,
              city: prefs.data.city,
            }
          : {};
      const result = await exploreActiveProperties(filters);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setRows([]);
      } else {
        setError(null);
        setRows(result.data);
      }
      setLoading(false);
    }
    if (sessionStatus === 'ready') void load();
    return () => {
      cancelled = true;
    };
  }, [canExplore, sessionStatus]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            Cliente
          </p>
          <Heading level={1}>{copy.exploreTitle}</Heading>
          <Text className="text-slate-600">{copy.exploreSubtitle}</Text>
        </div>
        <Link
          href="/app/habitacao"
          className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
        >
          {copy.backToHub}
        </Link>
      </header>

      {!canExplore && sessionStatus === 'ready' ? (
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p>{copy.needClient}</p>
          <Link
            href="/auth/onboarding/papeis"
            className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-3 inline-flex')}
          >
            {copy.activateRole}
          </Link>
        </div>
      ) : null}

      {loading ? <ModuleSkeleton rows={3} /> : null}
      {error ? (
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {error}
        </div>
      ) : null}

      {!loading && !error && canExplore && rows.length === 0 ? (
        <EmptyState
          title={copy.emptyTitle}
          description={copy.empty}
          action={
            <Link href="/app/habitacao" className={cn(buttonVariants({ variant: 'primary' }))}>
              {copy.emptyCta}
            </Link>
          }
        />
      ) : null}

      {rows.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={`/app/habitacao/detalhe?id=${encodeURIComponent(row.id)}`}
                className="flex flex-col gap-2 rounded-kuteka border border-slate-200 bg-white px-4 py-4 transition-colors hover:border-brand-300 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{row.title}</p>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">{row.code}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {[row.city, row.province].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="default">
                    {copy.types[row.property_type as keyof typeof copy.types] ?? row.property_type}
                  </Badge>
                  <Badge variant="brand">
                    {copy.purposes[row.purpose as keyof typeof copy.purposes] ?? row.purpose}
                  </Badge>
                  <span className="text-sm font-medium text-brand-800">{copy.openDetail}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
