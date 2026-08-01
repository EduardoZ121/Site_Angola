'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heading, Text, Badge, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { getPatrimoniosCopy } from '../content/pt';
import { getProperty, type PropertyRow } from '../services/properties-client';

export function PropertyDetailClient({ id }: { id: string }) {
  const copy = getPatrimoniosCopy();
  const [row, setRow] = useState<PropertyRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getProperty(id);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setRow(null);
      } else {
        setError(null);
        setRow(result.data);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <Text className="text-slate-500">A carregar…</Text>;

  if (error || !row) {
    return (
      <div className="flex flex-col gap-4">
        <Heading level={1}>{copy.detailTitle}</Heading>
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {error ?? copy.loadError}
        </div>
        <Link
          href="/app/patrimonios"
          className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit')}
        >
          {copy.backToList}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Heading level={1}>{row.title}</Heading>
          <p className="font-mono text-sm text-slate-500">{row.code}</p>
        </div>
        <Badge variant={row.status === 'active' ? 'success' : 'default'}>
          {copy.statuses[row.status as keyof typeof copy.statuses] ?? row.status}
        </Badge>
      </header>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {copy.fields.type}
          </dt>
          <dd className="mt-1 text-slate-900">
            {copy.types[row.property_type as keyof typeof copy.types] ?? row.property_type}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {copy.fields.purpose}
          </dt>
          <dd className="mt-1 text-slate-900">
            {copy.purposes[row.purpose as keyof typeof copy.purposes] ?? row.purpose}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {copy.fields.province}
          </dt>
          <dd className="mt-1 text-slate-900">{row.province || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {copy.fields.city}
          </dt>
          <dd className="mt-1 text-slate-900">{row.city || '—'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {copy.fields.address}
          </dt>
          <dd className="mt-1 text-slate-900">{row.address_line || '—'}</dd>
        </div>
        {row.notes ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {copy.fields.notes}
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-slate-900">{row.notes}</dd>
          </div>
        ) : null}
      </dl>

      <Link
        href="/app/patrimonios"
        className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit')}
      >
        {copy.backToList}
      </Link>
    </div>
  );
}
