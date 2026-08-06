'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getIdentidadeCopy } from '../content';
import { formatCompleteness, statusGlyph, statusLabel, statusTone } from '../lib/kyc';
import { buildTrustCenterModel, type TrustCenterModel } from '../lib/trust-center';
import { loadMyIdentity, type IdentityBundle } from '../services/identity-client';

const STEP_HREF: Record<string, string> = {
  contacts: '/app/perfil?passo=contacts',
  personal: '/app/perfil?passo=personal',
  document: '/app/perfil?passo=document',
  photo: '/app/perfil?passo=photo',
  address: '/app/perfil?passo=address',
  banking: '/app/perfil?passo=banking',
  overview: '/app/perfil',
  privacy: '/app/perfil?passo=privacy',
};

function accountTone(
  status: TrustCenterModel['accountStatus'],
): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'active') return 'success';
  if (status === 'pending') return 'warning';
  return 'danger';
}

function accountGlyph(status: TrustCenterModel['accountStatus']): string {
  if (status === 'active') return '🟢';
  if (status === 'pending') return '🟡';
  return '🔴';
}

/**
 * Centro de Confiança Kuteka — vista estilo banca digital sobre o KIS.
 */
export function TrustCenterClient() {
  const { locale } = useLocale();
  const copy = getIdentidadeCopy(locale);
  const tc = copy.trustCenter;
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const [bundle, setBundle] = useState<IdentityBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await loadMyIdentity();
    if (!result.ok) {
      setError(result.message);
      setBundle(null);
    } else {
      setError(null);
      setBundle(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (sessionStatus === 'ready') void load();
    if (sessionStatus === 'error') setLoading(false);
  }, [load, sessionStatus]);

  const model = useMemo(
    () => (bundle ? buildTrustCenterModel(bundle, copy) : null),
    [bundle, copy],
  );
  const nextHref = model ? (STEP_HREF[model.nextStepId] ?? '/app/perfil') : '/app/perfil';

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">{tc.kicker}</p>
          <Heading level={1}>{tc.title}</Heading>
          <Text className="mt-1 text-slate-700">{tc.subtitle}</Text>
          {session?.email ? <p className="kuteka-detail-meta mt-2">{session.email}</p> : null}
        </header>

        {error ? (
          <p className="rounded-kuteka border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </p>
        ) : null}

        <SoftListSlot pending={loading && !model}>
          {model ? (
            <>
              <section className="kuteka-detail-panel grid gap-4 p-5 sm:grid-cols-3">
                <div>
                  <p className="kuteka-detail-micro">{tc.accountStatusLabel}</p>
                  <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
                    <span aria-hidden>{accountGlyph(model.accountStatus)}</span>
                    {model.accountLabel}
                  </p>
                  <Badge className="mt-2" variant={accountTone(model.accountStatus)}>
                    {model.kycLabel}
                  </Badge>
                </div>
                <div>
                  <p className="kuteka-detail-micro">{tc.utsLabel}</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                    {Math.round(model.uts)}
                    <span className="text-base font-normal text-slate-500">{tc.utsOutOf}</span>
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{model.utsBandLabel}</p>
                </div>
                <div>
                  <p className="kuteka-detail-micro">{tc.profileLabel}</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                    {formatCompleteness(model.completeness)}
                  </p>
                  <div
                    className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
                    role="progressbar"
                    aria-valuenow={Math.round(model.completeness)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-slate-800 transition-[width]"
                      style={{ width: `${Math.min(100, Math.max(0, model.completeness))}%` }}
                    />
                  </div>
                </div>
              </section>

              <section className="kuteka-detail-panel p-5" aria-labelledby="trust-pillars">
                <h2 id="trust-pillars" className="kuteka-detail-title">
                  {tc.pillarsTitle}
                </h2>
                <ul className="mt-3 divide-y divide-slate-200 rounded-kuteka border border-slate-200 bg-white">
                  {model.pillars.map((pillar) => (
                    <li
                      key={pillar.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <span className="text-sm text-slate-800">
                        <span aria-hidden className="mr-2">
                          {statusGlyph(pillar.status)}
                        </span>
                        {pillar.label}
                      </span>
                      <Badge variant={statusTone(pillar.status)}>
                        {pillar.status === 'missing'
                          ? tc.pillarMissingLabel
                          : statusLabel(pillar.status, tc.statusLabels)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="kuteka-detail-panel p-5" aria-labelledby="trust-next">
                <h2 id="trust-next" className="kuteka-detail-title">
                  {tc.nextStepSectionTitle}
                </h2>
                <p className="mt-2 text-base font-medium text-slate-900">{model.nextStepTitle}</p>
                <Text className="mt-1 text-slate-700">{model.nextStepBody}</Text>
                {model.unlockHints.length ? (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                    {model.unlockHints.map((hint) => (
                      <li key={hint}>{hint}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={nextHref} className={cn(buttonVariants({ variant: 'primary' }))}>
                    {tc.continueKis}
                  </Link>
                  <Link href="/app/perfil" className={cn(buttonVariants({ variant: 'secondary' }))}>
                    {tc.openIdentity}
                  </Link>
                  <Link href="/app/confianca" className={cn(buttonVariants({ variant: 'ghost' }))}>
                    {tc.trustChecklist}
                  </Link>
                </div>
              </section>

              <section className="kuteka-detail-panel p-5">
                <h2 className="kuteka-detail-title">{tc.whyTitle}</h2>
                <Text className="mt-2 text-slate-700">{tc.whyBody}</Text>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => void load()}
                >
                  {tc.refresh}
                </Button>
              </section>
            </>
          ) : null}
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
