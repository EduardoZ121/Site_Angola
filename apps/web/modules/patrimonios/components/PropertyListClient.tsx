'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heading, Text, Badge, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Heading level={1}>{copy.title}</Heading>
          <Text className="text-slate-600">{copy.subtitle}</Text>
        </div>
        {canManage ? (
          <Link
            href="/app/patrimonios/novo"
            className={cn(buttonVariants({ variant: 'primary' }), 'w-fit shrink-0')}
          >
            {copy.activate}
          </Link>
        ) : null}
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

      {loading ? <Text className="text-slate-500">A carregar…</Text> : null}
      {error ? (
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {error}
        </div>
      ) : null}

      {!loading && !error && rows.length === 0 ? (
        <div className="rounded-kuteka border border-dashed border-slate-200 px-4 py-10 text-center">
          <Text className="text-slate-600">{copy.empty}</Text>
          {canManage ? (
            <Link
              href="/app/patrimonios/novo"
              className={cn(buttonVariants({ variant: 'primary' }), 'mt-4 inline-flex')}
            >
              {copy.activate}
            </Link>
          ) : null}
        </div>
      ) : null}

      {rows.length > 0 ? (
        <section aria-labelledby="property-list-heading" className="flex flex-col gap-3">
          <h2 id="property-list-heading" className="text-sm font-semibold text-slate-800">
            {copy.listHeading}
          </h2>
          <ul className="flex flex-col gap-3">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/app/patrimonios/detalhe?id=${row.id}`}
                  className="flex flex-col gap-2 rounded-kuteka border border-slate-200 bg-white px-4 py-4 transition-colors hover:border-brand-300 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{row.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {copy.types[row.property_type as keyof typeof copy.types] ??
                        row.property_type}
                      {row.city ? ` · ${row.city}` : ''}
                      {row.province ? `, ${row.province}` : ''}
                    </p>
                    <p className="mt-1 font-mono text-xs text-slate-400">{row.code}</p>
                  </div>
                  <Badge variant={row.status === 'active' ? 'success' : 'default'}>
                    {copy.statuses[row.status as keyof typeof copy.statuses] ?? row.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
