'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { ForbiddenPanel } from '@/modules/shell/components/ForbiddenPanel';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getAdministracaoCopy } from '../content';
import {
  fetchPlatformStats,
  listPendingInterests,
  type AdminInterestRow,
  type PlatformStats,
} from '../services/admin-client';
import { AuditCenterPanel } from './AuditCenterPanel';
import { KosAnalyticsPanel } from './KosAnalyticsPanel';
import { ModerationCenterPanel } from './ModerationCenterPanel';
import { PublicationReviewQueue } from './PublicationReviewQueue';

function hasAdminAccess(permissions: string[] | undefined): boolean {
  if (!permissions?.length) return false;
  return permissions.includes('admin.panel') || permissions.includes('properties.review');
}

export function AdminHubClient() {
  const { locale } = useLocale();
  const copy = getAdministracaoCopy(locale);
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const allowed = sessionStatus === 'ready' && hasAdminAccess(session?.permissions);
  const accessPending = sessionStatus === 'loading';
  const denied = sessionStatus === 'ready' && !allowed;

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [pending, setPending] = useState<AdminInterestRow[]>([]);
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
      const [statsResult, pendingResult] = await Promise.all([
        fetchPlatformStats(),
        listPendingInterests(),
      ]);
      if (cancelled) return;
      if (!statsResult.ok) {
        setError(statsResult.message);
        setStats(null);
      } else {
        setError(null);
        setStats(statsResult.data);
      }
      if (pendingResult.ok) setPending(pendingResult.data);
      setLoading(false);
    }
    if (sessionStatus === 'error') {
      setLoading(false);
      return;
    }
    if (sessionStatus === 'ready') void load();
    return () => {
      cancelled = true;
    };
  }, [allowed, sessionStatus]);

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-8">
        <header className="kuteka-glass flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Heading level={1}>{copy.title}</Heading>
            <Text className="text-slate-600">{copy.subtitle}</Text>
          </div>
          {allowed ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/app/confianca/revisao"
                className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
              >
                {copy.trustReview}
              </Link>
              <Link
                href="/app/habitacao/explorar"
                className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
              >
                {copy.housingExplore}
              </Link>
              <Link
                href="/app/contratos"
                className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
              >
                {copy.contracts}
              </Link>
              <Link
                href="/app/admin/utilizadores"
                className={cn(buttonVariants({ variant: 'primary' }), 'w-fit shrink-0')}
              >
                {copy.users}
              </Link>
            </div>
          ) : null}
        </header>

        {accessPending ? <SoftListSlot pending /> : null}
        {denied ? (
          <ForbiddenPanel
            message={copy.forbidden}
            primaryHref="/app"
            primaryLabel="Ir ao painel"
            steps={[
              { href: '/app', label: 'Painel', primary: true },
              { href: '/app/confianca', label: 'Confiança' },
              { href: '/contacto', label: 'Contactar Kuteka' },
            ]}
          />
        ) : null}

        {allowed ? (
          <>
            <p className="text-sm text-slate-500">{copy.mvpNote}</p>

            <KosAnalyticsPanel />

            <PublicationReviewQueue />

            <AuditCenterPanel />

            <ModerationCenterPanel />

            <SoftListSlot pending={loading && !stats}>
              <section className="flex flex-col gap-3" aria-labelledby="stats-heading">
                <div className="flex flex-col gap-1">
                  <h2 id="stats-heading" className="text-sm font-semibold text-slate-800">
                    {copy.statsTitle}
                  </h2>
                  <Text className="text-sm text-slate-500">{copy.statsHint}</Text>
                </div>
                {error ? (
                  <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    {error}
                  </div>
                ) : null}
                {!loading && !error && stats ? (
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(
                      [
                        ['profiles', stats.profiles],
                        ['properties', stats.properties_active],
                        ['agents', stats.roles_certified_agent],
                        ['assignments', stats.agent_assignments_active],
                        ['trust', stats.trust_pending ?? 0],
                        ['interests', stats.interests_pending ?? 0],
                        ['demo', stats.properties_demo ?? 0],
                        ['contractsActive', stats.contracts_active ?? 0],
                        ['contractsPending', stats.contracts_pending ?? 0],
                      ] as const
                    ).map(([key, value]) => (
                      <li
                        key={key}
                        className="rounded-kuteka border border-slate-200 bg-white px-4 py-4"
                      >
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {copy.stats[key]}
                        </p>
                        <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                          {value}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {!loading && !error && !stats ? (
                  <EmptyState title={copy.statsTitle} description={copy.loadError} />
                ) : null}
              </section>

              <section className="mt-8 flex flex-col gap-3" aria-labelledby="pending-heading">
                <div className="flex flex-col gap-1">
                  <h2 id="pending-heading" className="text-sm font-semibold text-slate-800">
                    {copy.pendingTitle}
                  </h2>
                  <Text className="text-sm text-slate-500">{copy.pendingHint}</Text>
                </div>
                {!loading && pending.length === 0 ? (
                  <EmptyState title={copy.pendingTitle} description={copy.emptyPending} />
                ) : null}
                {pending.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {pending.map((row) => (
                      <li
                        key={row.id}
                        className="flex flex-col gap-2 rounded-kuteka border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {row.property_title ?? row.property_id}
                          </p>
                          <p className="text-sm text-slate-500">
                            {new Date(row.created_at).toLocaleString('pt-PT')} · {row.status}
                          </p>
                        </div>
                        <Link
                          href={`/app/habitacao/detalhe?id=${encodeURIComponent(row.property_id)}`}
                          className={cn(
                            buttonVariants({ variant: 'secondary', size: 'sm' }),
                            'w-fit',
                          )}
                        >
                          {copy.openProperty}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>

              <FlowNextSteps
                title="Próximos passos da operação"
                steps={[
                  { href: '/app/admin/utilizadores', label: 'Gerir utilizadores', primary: true },
                  { href: '/app/contratos', label: 'Preparar contrato' },
                  { href: '/app/confianca/revisao', label: 'Rever Confiança' },
                  { href: '/app/habitacao/explorar', label: 'Ver inventário' },
                ]}
              />
            </SoftListSlot>
          </>
        ) : null}
      </div>
    </SessionStatusGate>
  );
}
