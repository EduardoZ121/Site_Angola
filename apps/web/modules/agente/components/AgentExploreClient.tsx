'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { ModuleSkeleton } from '@/modules/shell/components/ModuleSkeleton';
import { getAgenteCopy } from '../content/pt';
import {
  exploreActiveProperties,
  getAgentPreferences,
  type AgentPropertyRow,
} from '../services/agent-client';

export function AgentExploreClient() {
  const copy = getAgenteCopy();
  const { session, status: sessionStatus } = useAppSession();
  const canOperate = session?.permissions.includes('agent.operate') ?? false;
  const [rows, setRows] = useState<AgentPropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!canOperate) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const prefs = await getAgentPreferences();
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
  }, [canOperate, sessionStatus]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            Representação Kuteka
          </p>
          <Heading level={1}>{copy.exploreTitle}</Heading>
          <Text className="text-slate-600">{copy.exploreSubtitle}</Text>
        </div>
        <Link
          href="/app/habitacao/explorar"
          className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
        >
          Inventário Cliente
        </Link>
      </header>

      {!canOperate && sessionStatus === 'ready' ? (
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {copy.needAgent}
        </div>
      ) : null}

      {loading ? <ModuleSkeleton rows={3} /> : null}
      {error ? (
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {error}
        </div>
      ) : null}

      {!loading && !error && canOperate && rows.length === 0 ? (
        <EmptyState
          title={copy.emptyExploreTitle}
          description={copy.emptyExplore}
          action={
            <Link
              href="/app/habitacao/explorar"
              className={cn(buttonVariants({ variant: 'secondary' }))}
            >
              Ver inventário
            </Link>
          }
        />
      ) : null}

      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={`/app/agente/detalhe?id=${encodeURIComponent(row.id)}`}
              className="flex flex-col gap-2 rounded-kuteka border border-slate-200 bg-white px-4 py-4 hover:border-brand-300 sm:flex-row sm:items-center sm:justify-between"
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
    </div>
  );
}
