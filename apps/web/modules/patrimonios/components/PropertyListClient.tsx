'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heading, Text, Badge, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { formatAoa } from '@/lib/format/aoa';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { HeroMedia } from '@/modules/shell/components/HeroMedia';
import { ModuleSkeleton } from '@/modules/shell/components/ModuleSkeleton';
import { getPatrimoniosCopy } from '../content/pt';
import { listMyProperties, type PropertyRow } from '../services/properties-client';

export function PropertyListClient() {
  const copy = getPatrimoniosCopy();
  const { session, status: sessionStatus } = useAppSession();
  const canManage = session?.permissions.includes('properties.manage') ?? false;
  const [rows, setRows] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await listMyProperties();
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
  }, [sessionStatus]);

  return (
    <div className="flex flex-col gap-8">
      <HeroMedia preset="patrimonios" />
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Heading level={1}>{copy.title}</Heading>
          <Text className="text-slate-600">{copy.subtitle}</Text>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/habitacao/explorar"
            className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
          >
            {copy.seeInHousing}
          </Link>
          {canManage ? (
            <Link
              href="/app/patrimonios/novo"
              className={cn(buttonVariants({ variant: 'primary' }), 'w-fit shrink-0')}
            >
              {copy.activate}
            </Link>
          ) : null}
        </div>
      </header>

      {!canManage && sessionStatus === 'ready' ? (
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p>{copy.needPartner}</p>
          <Link
            href="/auth/onboarding/papeis"
            className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-3 inline-flex')}
          >
            {copy.activateRole}
          </Link>
        </div>
      ) : null}

      <p className="text-sm text-slate-500">{copy.mvpNote}</p>

      {loading ? <ModuleSkeleton rows={3} /> : null}
      {error ? (
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {error}
        </div>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <EmptyState
          title={copy.emptyTitle}
          description={copy.empty}
          action={
            canManage ? (
              <Link
                href="/app/patrimonios/novo"
                className={cn(buttonVariants({ variant: 'primary' }))}
              >
                {copy.emptyCta}
              </Link>
            ) : null
          }
        />
      ) : null}

      {rows.length > 0 ? (
        <section aria-labelledby="property-list-heading" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="property-list-heading" className="text-sm font-semibold text-slate-800">
              {copy.listHeading}
            </h2>
            <Text className="text-sm text-slate-500">{copy.listHint}</Text>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/app/patrimonios/detalhe?id=${row.id}`}
                  className="flex h-full flex-col overflow-hidden rounded-kuteka border border-slate-200 bg-white transition-colors hover:border-brand-300"
                >
                  <div className="aspect-[16/10] bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.cover_image_url || '/images/hero.jpg'}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-slate-900">{row.title}</p>
                      <Badge variant={row.status === 'active' ? 'success' : 'default'}>
                        {copy.statuses[row.status as keyof typeof copy.statuses] ?? row.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-brand-800">
                      {formatAoa(row.price_aoa, row.purpose)}
                    </p>
                    <p className="text-sm text-slate-600">
                      {copy.types[row.property_type as keyof typeof copy.types] ??
                        row.property_type}
                      {row.city ? ` · ${row.city}` : ''}
                      {row.province ? `, ${row.province}` : ''}
                    </p>
                    <p className="font-mono text-xs text-slate-400">{row.code}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
