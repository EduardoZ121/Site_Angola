'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heading, Text, Badge, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { formatAoa } from '@/lib/format/aoa';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { ForbiddenPanel } from '@/modules/shell/components/ForbiddenPanel';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getPatrimoniosCopy } from '../content';
import { listMyProperties, type PropertyRow } from '../services/properties-client';
import { PartnerLifecyclePanel } from './PartnerLifecyclePanel';

export function PropertyListClient() {
  const { locale } = useLocale();
  const copy = getPatrimoniosCopy(locale);
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const canManage =
    sessionStatus === 'ready' && !!session?.permissions.includes('properties.manage');
  const canHousing =
    sessionStatus === 'ready' && !!session?.permissions.includes('housing.explore');
  const accessPending = sessionStatus === 'loading';
  const denied = sessionStatus === 'ready' && !canManage;
  const [rows, setRows] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!canManage) {
        setLoading(false);
        setRows([]);
        return;
      }
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
    if (sessionStatus === 'error') {
      setLoading(false);
      return;
    }
    if (sessionStatus === 'ready') void load();
    return () => {
      cancelled = true;
    };
  }, [canManage, sessionStatus]);

  const nextSteps = [
    ...(canHousing
      ? [{ href: '/app/habitacao/explorar', label: copy.seeInHousing, primary: true as const }]
      : [{ href: '/app', label: copy.nextSteps.goDashboard, primary: true as const }]),
    ...(canManage ? [{ href: '/app/patrimonios/novo', label: copy.activate }] : []),
    { href: '/app/confianca', label: copy.nextSteps.verifyAccount },
  ];

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-8">
        <header className="kuteka-glass flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Heading level={1}>{copy.title}</Heading>
            <Text className="text-stone-700">{copy.subtitle}</Text>
          </div>
          <div className="flex flex-wrap gap-2">
            {canHousing ? (
              <Link
                href="/app/habitacao/explorar"
                className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
              >
                {copy.seeInHousing}
              </Link>
            ) : null}
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

        {accessPending ? <SoftListSlot pending /> : null}
        {denied ? (
          <ForbiddenPanel
            message={copy.needPartner}
            primaryHref="/auth/onboarding/papeis"
            primaryLabel={copy.activateRole}
            steps={[
              { href: '/app', label: copy.nextSteps.goDashboard, primary: true },
              { href: '/app/confianca', label: copy.nextSteps.verifyAccount },
              { href: '/app/agente', label: copy.nextSteps.seeAgentArea },
            ]}
          />
        ) : null}

        {canManage ? (
          <SoftListSlot pending={loading && rows.length === 0}>
            <PartnerLifecyclePanel />
            <p className="text-sm text-stone-700">{copy.mvpNote}</p>

            {error ? (
              <div
                role="alert"
                className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              >
                {error}
              </div>
            ) : null}

            {!loading && !error && rows.length === 0 ? (
              <EmptyState
                title={copy.emptyTitle}
                description={copy.empty}
                action={
                  <Link
                    href="/app/patrimonios/novo"
                    className={cn(buttonVariants({ variant: 'primary' }))}
                  >
                    {copy.emptyCta}
                  </Link>
                }
              />
            ) : null}

            {rows.length > 0 ? (
              <section aria-labelledby="property-list-heading" className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <h2 id="property-list-heading" className="text-sm font-semibold text-slate-800">
                    {copy.listHeading}
                  </h2>
                  <Text className="text-sm text-stone-700">{copy.listHint}</Text>
                </div>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {rows.map((row) => (
                    <li key={row.id}>
                      <Link
                        href={`/app/patrimonios/detalhe?id=${row.id}`}
                        className="flex h-full flex-col overflow-hidden rounded-kuteka border border-slate-200 bg-white transition-colors hover:border-brand-300"
                        aria-label={row.title}
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
                              {copy.statuses[row.status as keyof typeof copy.statuses] ??
                                row.status}
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
                          <p className="font-mono text-xs text-stone-600">{row.code}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <FlowNextSteps title={copy.nextSteps.continueFlowTitle} steps={nextSteps} />
          </SoftListSlot>
        ) : null}
      </div>
    </SessionStatusGate>
  );
}
