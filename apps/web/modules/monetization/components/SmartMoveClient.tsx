'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Badge, Button, Heading, Label, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { LOCALE_INTL_TAG } from '@/modules/i18n/types';
import { KisGateBanner } from '@/modules/identidade/components/KisGateBanner';
import { getMyKycLevel } from '@/modules/identidade/services/identity-client';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { formatAoaAmount } from '@/modules/finance/lib/format';
import { getMonetizationCopy, type MonetizationCopy } from '@/modules/monetization/content';
import {
  URGENCY_OPTIONS,
  smartMoveStatusLabel,
  smartMoveStatusTone,
  urgencyLabel,
  urgencyOptionLabel,
  type SmartMoveUrgency,
} from '@/modules/monetization/lib/catalog';
import {
  acceptSmartMoveMatch,
  cancelSmartMove,
  createSmartMoveRequest,
  failSmartMove,
  fetchSmartMoveContext,
  listSmartMoveEvents,
  listSmartMoveRequests,
  matchSmartMove,
  rejectSmartMoveMatch,
  type SmartMoveEvent,
  type SmartMoveRequestDetail,
} from '@/modules/monetization/services/smart-move-client';

function slaLabel(row: SmartMoveRequestDetail, copy: MonetizationCopy['common']): string | null {
  if (!row.sla_due_at) return null;
  if (row.sla_breached) return copy.slaBreached;
  if (row.status === 'completed' || row.status === 'cancelled' || row.status === 'failed') {
    return null;
  }
  const hours = Math.round((new Date(row.sla_due_at).getTime() - Date.now()) / 3_600_000);
  if (hours <= 0) return copy.slaAtLimit;
  if (hours < 48) return copy.slaInHours.replace('{hours}', String(hours));
  return copy.slaInDays.replace('{days}', String(Math.round(hours / 24)));
}

/**
 * Mudança Inteligente N5 — pipeline completo sobre a infraestrutura financeira
 * partilhada (Ledger + Kuteka Pay + reembolsos/créditos). Abertura no arranque,
 * sucesso só quando a Kuteka encontra solução aceite, reembolso por urgência.
 */
export function SmartMoveClient() {
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const { locale } = useLocale();
  const copy = getMonetizationCopy(locale).smartMove;
  const common = getMonetizationCopy(locale).common;
  const dateLocale = LOCALE_INTL_TAG[locale];
  const ready = sessionStatus === 'ready';
  const [rows, setRows] = useState<SmartMoveRequestDetail[]>([]);
  const [contracts, setContracts] = useState<{ id: string; code: string; title: string }[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [canOperate, setCanOperate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<SmartMoveUrgency>('urgent_30');
  const [contractId, setContractId] = useState('');
  const [notes, setNotes] = useState('');
  const [matchInputs, setMatchInputs] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<Record<string, SmartMoveEvent[]>>({});
  const [openTimeline, setOpenTimeline] = useState<string | null>(null);
  const [kycLevel, setKycLevel] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const [req, ctx, kyc] = await Promise.all([
      listSmartMoveRequests(),
      fetchSmartMoveContext(),
      getMyKycLevel(),
    ]);
    if (req.ok) setRows(req.data);
    else setError(req.message);
    if (ctx.ok) setCanOperate(ctx.data.canOperate);
    if (kyc.ok) setKycLevel(kyc.level);

    const client = createBrowserClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    setUid(user?.id ?? null);
    if (user) {
      const { data } = await client
        .from('property_contracts')
        .select('id,code,status,properties(title)')
        .eq('client_id', user.id)
        .is('deleted_at', null)
        .in('status', ['active', 'pending', 'draft'])
        .order('created_at', { ascending: false })
        .limit(10);
      setContracts(
        (data ?? []).map((c) => {
          const props = c.properties as { title?: string } | { title?: string }[] | null;
          const title = Array.isArray(props) ? props[0]?.title : props?.title;
          return {
            id: c.id as string,
            code: String(c.code ?? c.id).slice(0, 12),
            title: title ?? 'Contrato',
          };
        }),
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (ready) void load();
  }, [load, ready]);

  const run = useCallback(
    async (
      id: string,
      action: () => Promise<{ ok: true; data?: unknown } | { ok: false; message: string }>,
      okMessage: string,
    ) => {
      setBusyId(id);
      setError(null);
      setMessage(null);
      const result = await action();
      setBusyId(null);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMessage(okMessage);
      await load();
    },
    [load],
  );

  const toggleTimeline = useCallback(
    async (requestId: string) => {
      if (openTimeline === requestId) {
        setOpenTimeline(null);
        return;
      }
      setOpenTimeline(requestId);
      if (!events[requestId]) {
        const res = await listSmartMoveEvents(requestId);
        if (res.ok) setEvents((prev) => ({ ...prev, [requestId]: res.data }));
      }
    },
    [events, openTimeline],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusyId('create');
    setError(null);
    setMessage(null);
    const opt = URGENCY_OPTIONS.find((o) => o.value === urgency)!;
    const target = new Date();
    target.setDate(target.getDate() + opt.days);
    const targetExitOn = target.toISOString().slice(0, 10);
    const result = await createSmartMoveRequest({
      urgencyBand: urgency,
      targetExitOn,
      contractId: contractId || null,
      preferences: { notes: notes.trim() || undefined, source: 'smart_move_page' },
    });
    setBusyId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(copy.messages.activated);
    setNotes('');
    await load();
  }

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">{copy.eyebrow}</p>
          <Heading level={1}>{copy.title}</Heading>
          <Text className="mt-1 text-slate-700">{copy.subtitle}</Text>
          {session?.email ? <p className="kuteka-detail-meta mt-2">{session.email}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/app/servicos" className={cn(buttonVariants({ variant: 'secondary' }))}>
              {copy.providersLink}
            </Link>
            <Link href="/app/financeiro" className={cn(buttonVariants({ variant: 'ghost' }))}>
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

        <KisGateBanner level={kycLevel} action="smart_move" minLevel={2} />

        <SoftListSlot pending={loading}>
          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">{copy.newRequestTitle}</h2>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
              <div>
                <Label htmlFor="urgency">{copy.urgencyLabel}</Label>
                <select
                  id="urgency"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as SmartMoveUrgency)}
                >
                  {URGENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {urgencyOptionLabel(o.value, locale)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="contract">{copy.contractLabel}</Label>
                <select
                  id="contract"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                >
                  <option value="">{copy.noContractOption}</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} · {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">{copy.notesLabel}</Label>
                <textarea
                  id="notes"
                  className="min-h-[80px] w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={copy.notesPlaceholder}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" loading={busyId === 'create'}>
                  {copy.submit}
                </Button>
              </div>
            </form>
          </section>

          <section className="kuteka-detail-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="kuteka-detail-title">{copy.requestsTitle}</h2>
              {canOperate ? <Badge variant="default">{copy.operatorBadge}</Badge> : null}
            </div>
            <ul className="mt-3 divide-y divide-slate-200">
              {rows.map((r) => {
                const busy = busyId === r.id;
                const owned = r.client_id === uid;
                const sla = slaLabel(r, common);
                const timelineOpen = openTimeline === r.id;
                return (
                  <li key={r.id} className="flex flex-col gap-2 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {urgencyLabel(r.urgency_band, locale)} · saída {r.target_exit_on}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {r.opening_amount_aoa != null
                            ? copy.openingAmount.replace(
                                '{amount}',
                                formatAoaAmount(Number(r.opening_amount_aoa)),
                              )
                            : copy.openingPending}
                          {r.opening_payment_intent_id ? copy.paidSuffix : ''}
                          {r.success_amount_aoa != null
                            ? copy.successAmountSuffix.replace(
                                '{amount}',
                                formatAoaAmount(Number(r.success_amount_aoa)),
                              )
                            : ''}
                          {r.success_charged_at ? copy.chargedSuffix : ''}
                          {sla ? ` · ${sla}` : ''}
                        </p>
                        {r.match_notes ? (
                          <p className="mt-1 text-sm text-slate-600">
                            {copy.solutionPrefix.replace('{value}', r.match_notes)}
                          </p>
                        ) : null}
                        {r.failure_reason ? (
                          <p className="mt-1 text-sm text-rose-700">
                            {common.reason.replace('{value}', r.failure_reason)}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(r.created_at).toLocaleString(dateLocale)}
                          {r.partner_notified_at ? copy.partnerNotifiedSuffix : ''}
                          {r.agent_task_created_at ? copy.agentTaskSuffix : ''}
                        </p>
                      </div>
                      <Badge variant={smartMoveStatusTone(r.status)}>
                        {smartMoveStatusLabel(r.status, locale)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {owned && r.status === 'matched' ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            loading={busy}
                            onClick={() =>
                              run(
                                r.id,
                                () => acceptSmartMoveMatch({ requestId: r.id }),
                                copy.messages.accepted,
                              )
                            }
                          >
                            {copy.acceptAndPay}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            loading={busy}
                            onClick={() =>
                              run(
                                r.id,
                                () => rejectSmartMoveMatch({ requestId: r.id }),
                                copy.messages.rejected,
                              )
                            }
                          >
                            {copy.reject}
                          </Button>
                        </>
                      ) : null}

                      {owned && ['draft', 'awaiting_payment', 'active'].includes(r.status) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          loading={busy}
                          onClick={() =>
                            run(
                              r.id,
                              () => cancelSmartMove({ requestId: r.id }),
                              copy.messages.cancelled,
                            )
                          }
                        >
                          {common.cancel}
                        </Button>
                      ) : null}

                      {canOperate && r.status === 'active' ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            aria-label={copy.matchInputAria}
                            placeholder={copy.matchInputPlaceholder}
                            className="w-56 rounded-kuteka border border-slate-300 bg-white px-2 py-1 text-sm"
                            value={matchInputs[r.id] ?? ''}
                            onChange={(e) =>
                              setMatchInputs({ ...matchInputs, [r.id]: e.target.value })
                            }
                          />
                          <Button
                            type="button"
                            size="sm"
                            loading={busy}
                            onClick={() =>
                              run(
                                r.id,
                                () =>
                                  matchSmartMove({
                                    requestId: r.id,
                                    matchedPropertyId: matchInputs[r.id]?.trim() || null,
                                    notes: 'Solução proposta pela Kuteka.',
                                  }),
                                copy.messages.matched,
                              )
                            }
                          >
                            {copy.registerMatch}
                          </Button>
                        </div>
                      ) : null}

                      {canOperate && ['active', 'matched'].includes(r.status) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          loading={busy}
                          onClick={() =>
                            run(
                              r.id,
                              () =>
                                failSmartMove({
                                  requestId: r.id,
                                  reason: copy.failReasonDefault,
                                }),
                              copy.messages.failed,
                            )
                          }
                        >
                          {copy.failSla}
                        </Button>
                      ) : null}

                      <button
                        type="button"
                        className="text-xs font-medium text-brand-700 underline-offset-2 hover:underline"
                        onClick={() => toggleTimeline(r.id)}
                      >
                        {timelineOpen ? common.hideTimeline : common.viewTimeline}
                      </button>
                    </div>

                    {timelineOpen ? (
                      <ol className="mt-1 space-y-1 rounded-kuteka bg-slate-50 p-3">
                        {(events[r.id] ?? []).map((ev) => (
                          <li key={ev.id} className="text-xs text-slate-600">
                            <span className="font-medium text-slate-800">{ev.event_type}</span>
                            {ev.from_status && ev.to_status && ev.from_status !== ev.to_status
                              ? ` · ${ev.from_status} → ${ev.to_status}`
                              : ''}
                            {ev.note ? ` · ${ev.note}` : ''}
                            <span className="ml-1 text-slate-400">
                              {new Date(ev.created_at).toLocaleString(dateLocale)}
                            </span>
                          </li>
                        ))}
                        {(events[r.id] ?? []).length === 0 ? (
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
