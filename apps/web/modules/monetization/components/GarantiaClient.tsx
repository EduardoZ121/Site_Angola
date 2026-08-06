'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Badge, Button, Heading, Label, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { LOCALE_INTL_TAG } from '@/modules/i18n/types';
import { formatAoaAmount } from '@/modules/finance/lib/format';
import { getMonetizationCopy } from '@/modules/monetization/content';
import { garantiaStatusLabel, garantiaStatusTone } from '@/modules/monetization/lib/catalog';
import {
  activateGarantia,
  cancelGarantia,
  createGarantiaSubscription,
  fetchGarantiaContext,
  listGarantiaEvents,
  listGarantiaSubscriptions,
  markGarantiaPaymentStatus,
  type GarantiaEvent,
  type GarantiaSubscription,
} from '@/modules/monetization/services/garantia-client';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';

export function GarantiaClient() {
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const { locale } = useLocale();
  const copy = getMonetizationCopy(locale).garantia;
  const common = getMonetizationCopy(locale).common;
  const dateLocale = LOCALE_INTL_TAG[locale];
  const [rows, setRows] = useState<GarantiaSubscription[]>([]);
  const [events, setEvents] = useState<Record<string, GarantiaEvent[]>>({});
  const [openTimeline, setOpenTimeline] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [canOperate, setCanOperate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState('');
  const [contractId, setContractId] = useState('');
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [subscriptions, context, user] = await Promise.all([
      listGarantiaSubscriptions(),
      fetchGarantiaContext(),
      createBrowserClient().auth.getUser(),
    ]);
    if (subscriptions.ok) setRows(subscriptions.data);
    else setError(subscriptions.message);
    if (context.ok) setCanOperate(context.data.canOperate);
    setUid(user.data.user?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (sessionStatus === 'ready') void load();
  }, [load, sessionStatus]);

  const run = useCallback(
    async (
      id: string,
      action: () => Promise<{ ok: true; data?: unknown } | { ok: false; message: string }>,
      success: string,
    ) => {
      setBusyId(id);
      setError(null);
      setMessage(null);
      const result = await action();
      setBusyId(null);
      if (!result.ok) return setError(result.message);
      setMessage(success);
      setOpenTimeline(null);
      setEvents({});
      await load();
    },
    [load],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusyId('create');
    setError(null);
    setMessage(null);
    const result = await createGarantiaSubscription({
      propertyId: propertyId.trim() || null,
      contractId: contractId.trim() || null,
    });
    setBusyId(null);
    if (!result.ok) return setError(result.message);
    setMessage(copy.messages.created);
    setPropertyId('');
    setContractId('');
    await load();
  }

  async function toggleTimeline(subscriptionId: string) {
    if (openTimeline === subscriptionId) return setOpenTimeline(null);
    setOpenTimeline(subscriptionId);
    if (!events[subscriptionId]) {
      const result = await listGarantiaEvents(subscriptionId);
      if (result.ok) setEvents((current) => ({ ...current, [subscriptionId]: result.data }));
      else setError(result.message);
    }
  }

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">{copy.eyebrow}</p>
          <Heading level={1}>{copy.title}</Heading>
          <Text className="mt-1 text-slate-700">{copy.subtitle}</Text>
          {session?.email ? <p className="kuteka-detail-meta mt-2">{session.email}</p> : null}
          <div className="mt-4">
            <Link href="/app/financeiro" className={cn(buttonVariants({ variant: 'secondary' }))}>
              {common.financeiro}
            </Link>
          </div>
        </header>

        {error ? (
          <p className="rounded-kuteka border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-kuteka border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {message}
          </p>
        ) : null}

        <SoftListSlot pending={loading}>
          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">{copy.newSubTitle}</h2>
            <p className="kuteka-detail-body mt-1">{copy.newSubBody}</p>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
              <div>
                <Label htmlFor="garantia-property">{copy.propertyLabel}</Label>
                <input
                  id="garantia-property"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={propertyId}
                  onChange={(event) => setPropertyId(event.target.value)}
                  placeholder={copy.propertyPlaceholder}
                />
              </div>
              <div>
                <Label htmlFor="garantia-contract">{copy.contractLabel}</Label>
                <input
                  id="garantia-contract"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={contractId}
                  onChange={(event) => setContractId(event.target.value)}
                  placeholder={copy.contractPlaceholder}
                />
              </div>
              <Button type="submit" loading={busyId === 'create'} className="sm:col-span-2">
                {copy.submit}
              </Button>
            </form>
          </section>

          <section className="kuteka-detail-panel p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="kuteka-detail-title">{copy.subscriptionsTitle}</h2>
              {canOperate ? <Badge variant="default">{copy.operatorBadge}</Badge> : null}
            </div>
            <ul className="mt-3 divide-y divide-slate-200">
              {rows.map((row) => {
                const owned = row.client_id === uid;
                const busy = busyId === row.id;
                return (
                  <li key={row.id} className="flex flex-col gap-3 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">{copy.monthlyLabel}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {row.monthly_amount_aoa
                            ? formatAoaAmount(Number(row.monthly_amount_aoa))
                            : copy.defaultAmount}
                          {row.payment_intent_id ? copy.paidSuffix : ''}
                          {row.property_id
                            ? copy.propertySuffix.replace('{id}', row.property_id.slice(0, 8))
                            : ''}
                          {row.contract_id
                            ? copy.contractSuffix.replace('{id}', row.contract_id.slice(0, 8))
                            : ''}
                        </p>
                        {row.coverage_starts_at ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {copy.coveragePrefix}
                            {new Date(row.coverage_starts_at).toLocaleDateString(dateLocale)}
                            {row.coverage_ends_at
                              ? ` — ${new Date(row.coverage_ends_at).toLocaleDateString(dateLocale)}`
                              : ''}
                          </p>
                        ) : null}
                        {row.status_reason ? (
                          <p className="mt-1 text-sm text-rose-700">
                            {common.reason.replace('{value}', row.status_reason)}
                          </p>
                        ) : null}
                      </div>
                      <Badge variant={garantiaStatusTone(row.status)}>
                        {garantiaStatusLabel(row.status, locale)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {owned && row.status === 'draft' ? (
                        <Button
                          size="sm"
                          loading={busy}
                          onClick={() =>
                            run(
                              row.id,
                              () => activateGarantia({ subscriptionId: row.id }),
                              copy.messages.activated,
                            )
                          }
                        >
                          {copy.activateAndPay}
                        </Button>
                      ) : null}
                      {(owned || canOperate) &&
                      ['draft', 'awaiting_payment', 'active', 'past_due'].includes(row.status) ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={busy}
                          onClick={() =>
                            run(
                              row.id,
                              () =>
                                cancelGarantia({
                                  subscriptionId: row.id,
                                  reason: reasons[row.id] || null,
                                }),
                              copy.messages.cancelled,
                            )
                          }
                        >
                          {common.cancel}
                        </Button>
                      ) : null}
                      {canOperate &&
                      ['awaiting_payment', 'active', 'past_due'].includes(row.status) ? (
                        <>
                          <input
                            aria-label={copy.reasonAria}
                            placeholder={copy.reasonPlaceholder}
                            className="w-56 rounded-kuteka border border-slate-300 bg-white px-2 py-1 text-sm"
                            value={reasons[row.id] ?? ''}
                            onChange={(event) =>
                              setReasons((current) => ({
                                ...current,
                                [row.id]: event.target.value,
                              }))
                            }
                          />
                          {row.status !== 'past_due' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={busy}
                              onClick={() =>
                                run(
                                  row.id,
                                  () =>
                                    markGarantiaPaymentStatus({
                                      subscriptionId: row.id,
                                      status: 'past_due',
                                      reason: reasons[row.id] || null,
                                    }),
                                  copy.messages.pastDue,
                                )
                              }
                            >
                              {copy.markPastDue}
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="ghost"
                            loading={busy}
                            onClick={() =>
                              run(
                                row.id,
                                () =>
                                  markGarantiaPaymentStatus({
                                    subscriptionId: row.id,
                                    status: 'failed',
                                    reason: reasons[row.id] || null,
                                  }),
                                copy.messages.failed,
                              )
                            }
                          >
                            {copy.markFail}
                          </Button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        className="text-xs font-medium text-brand-700 hover:underline"
                        onClick={() => void toggleTimeline(row.id)}
                      >
                        {openTimeline === row.id ? common.hideTimeline : common.viewTimeline}
                      </button>
                    </div>

                    {openTimeline === row.id ? (
                      <ol className="space-y-1 rounded-kuteka bg-slate-50 p-3">
                        {(events[row.id] ?? []).map((timelineEvent) => (
                          <li key={timelineEvent.id} className="text-xs text-slate-600">
                            <strong>{timelineEvent.event_type}</strong>
                            {timelineEvent.from_status && timelineEvent.to_status
                              ? ` · ${timelineEvent.from_status} → ${timelineEvent.to_status}`
                              : ''}
                            {timelineEvent.note ? ` · ${timelineEvent.note}` : ''}
                            {` · ${new Date(timelineEvent.created_at).toLocaleString(dateLocale)}`}
                          </li>
                        ))}
                        {(events[row.id] ?? []).length === 0 ? (
                          <li className="text-xs text-slate-500">{common.noEvents}</li>
                        ) : null}
                      </ol>
                    ) : null}
                  </li>
                );
              })}
              {rows.length === 0 ? (
                <li className="py-3 text-sm text-slate-500">{copy.emptyList}</li>
              ) : null}
            </ul>
          </section>
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
