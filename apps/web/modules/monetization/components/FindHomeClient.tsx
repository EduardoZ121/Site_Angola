'use client';

import Link from 'next/link';
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { Badge, Button, Heading, Label, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { LOCALE_INTL_TAG } from '@/modules/i18n/types';
import { formatAoaAmount } from '@/modules/finance/lib/format';
import { getMonetizationCopy } from '@/modules/monetization/content';
import {
  FIND_HOME_TYPOLOGY_OPTIONS,
  findHomeStatusLabel,
  findHomeStatusTone,
  findHomeTypologyLabel,
  findHomeTypologyOptionLabel,
  type FindHomeTypologyValue,
} from '@/modules/monetization/lib/catalog';
import {
  acceptFindHomeMatch,
  cancelFindHome,
  createFindHomeRequest,
  failFindHome,
  fetchFindHomeContext,
  listFindHomeEvents,
  listFindHomeRequests,
  matchFindHome,
  rejectFindHomeMatch,
  type FindHomeEvent,
  type FindHomeRequestDetail,
} from '@/modules/monetization/services/find-home-client';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';

function slaLabel(
  row: FindHomeRequestDetail,
  common: ReturnType<typeof getMonetizationCopy>['common'],
) {
  if (!row.sla_due_at || ['completed', 'cancelled', 'failed'].includes(row.status)) return null;
  if (row.sla_breached) return common.slaBreached;
  const hours = Math.round((new Date(row.sla_due_at).getTime() - Date.now()) / 3_600_000);
  return hours < 48
    ? common.slaInHours.replace('{hours}', String(Math.max(0, hours)))
    : common.slaInDays.replace('{days}', String(Math.round(hours / 24)));
}

export function FindHomeClient() {
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const { locale } = useLocale();
  const copy = getMonetizationCopy(locale).findHome;
  const common = getMonetizationCopy(locale).common;
  const dateLocale = LOCALE_INTL_TAG[locale];
  const [rows, setRows] = useState<FindHomeRequestDetail[]>([]);
  const [events, setEvents] = useState<Record<string, FindHomeEvent[]>>({});
  const [openTimeline, setOpenTimeline] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [canOperate, setCanOperate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [province, setProvince] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [typology, setTypology] = useState<FindHomeTypologyValue>('t2');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [matchInputs, setMatchInputs] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [requests, context, user] = await Promise.all([
      listFindHomeRequests(),
      fetchFindHomeContext(),
      createBrowserClient().auth.getUser(),
    ]);
    if (requests.ok) setRows(requests.data);
    else setError(requests.message);
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
      await load();
    },
    [load],
  );

  async function toggleTimeline(requestId: string) {
    if (openTimeline === requestId) return setOpenTimeline(null);
    setOpenTimeline(requestId);
    if (!events[requestId]) {
      const result = await listFindHomeEvents(requestId);
      if (result.ok) setEvents((current) => ({ ...current, [requestId]: result.data }));
      else setError(result.message);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusyId('create');
    setError(null);
    const result = await createFindHomeRequest({
      province: province.trim(),
      municipality: municipality.trim(),
      typology,
      budgetMax: Number(budget),
      notes: notes.trim() || null,
      preferences: { source: 'find_home_page' },
    });
    setBusyId(null);
    if (!result.ok) return setError(result.message);
    setMessage(copy.messages.created);
    setNotes('');
    await load();
  }

  const fields: [string, string, string, Dispatch<SetStateAction<string>>, string][] = [
    ['province', copy.provinceLabel, province, setProvince, copy.provincePlaceholder],
    [
      'municipality',
      copy.municipalityLabel,
      municipality,
      setMunicipality,
      copy.municipalityPlaceholder,
    ],
  ];

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">{copy.eyebrow}</p>
          <Heading level={1}>{copy.title}</Heading>
          <Text className="mt-1 text-slate-700">{copy.subtitle}</Text>
          {session?.email ? <p className="kuteka-detail-meta mt-2">{session.email}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/app/habitacao/explorar"
              className={cn(buttonVariants({ variant: 'secondary' }))}
            >
              {copy.exploreLink}
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

        <SoftListSlot pending={loading}>
          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">{copy.newRequestTitle}</h2>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
              {fields.map(([id, label, value, setter, placeholder]) => (
                <div key={id}>
                  <Label htmlFor={id}>{label}</Label>
                  <input
                    id={id}
                    required
                    className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                    value={value}
                    onChange={(event) => setter(event.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              ))}
              <div>
                <Label htmlFor="typology">{copy.typologyLabel}</Label>
                <select
                  id="typology"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={typology}
                  onChange={(event) => setTypology(event.target.value as FindHomeTypologyValue)}
                >
                  {FIND_HOME_TYPOLOGY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {findHomeTypologyOptionLabel(option.value, locale)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="budget">{copy.budgetLabel}</Label>
                <input
                  id="budget"
                  required
                  type="number"
                  min="1"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">{copy.notesLabel}</Label>
                <textarea
                  id="notes"
                  className="min-h-[80px] w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={copy.notesPlaceholder}
                />
              </div>
              <Button type="submit" loading={busyId === 'create'} className="sm:col-span-2">
                {copy.submit}
              </Button>
            </form>
          </section>

          <section className="kuteka-detail-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="kuteka-detail-title">{copy.requestsTitle}</h2>
              {canOperate ? <Badge variant="default">{copy.operatorBadge}</Badge> : null}
            </div>
            <ul className="mt-3 divide-y divide-slate-200">
              {rows.map((row) => {
                const owned = row.client_id === uid;
                const busy = busyId === row.id;
                const sla = slaLabel(row, common);
                return (
                  <li key={row.id} className="flex flex-col gap-2 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {[
                            row.province,
                            row.municipality,
                            findHomeTypologyLabel(row.typology, locale),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.budget_max_aoa
                            ? copy.budgetUpTo.replace(
                                '{amount}',
                                formatAoaAmount(Number(row.budget_max_aoa)),
                              )
                            : copy.budgetOpen}
                          {row.priority_amount_aoa
                            ? copy.priorityAmountSuffix.replace(
                                '{amount}',
                                formatAoaAmount(Number(row.priority_amount_aoa)),
                              )
                            : ''}
                          {row.payment_intent_id ? copy.paidSuffix : ''}
                          {sla ? ` · ${sla}` : ''}
                        </p>
                        {row.match_notes ? (
                          <p className="mt-1 text-sm text-slate-600">
                            {copy.matchPrefix.replace('{value}', row.match_notes)}
                          </p>
                        ) : null}
                        {row.failure_reason ? (
                          <p className="mt-1 text-sm text-rose-700">
                            {common.reason.replace('{value}', row.failure_reason)}
                          </p>
                        ) : null}
                      </div>
                      <Badge variant={findHomeStatusTone(row.status)}>
                        {findHomeStatusLabel(row.status, locale)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {owned && row.status === 'matched' ? (
                        <>
                          <Button
                            size="sm"
                            loading={busy}
                            onClick={() =>
                              run(
                                row.id,
                                () => acceptFindHomeMatch({ requestId: row.id }),
                                copy.messages.accepted,
                              )
                            }
                          >
                            {copy.acceptHome}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={busy}
                            onClick={() =>
                              run(
                                row.id,
                                () => rejectFindHomeMatch({ requestId: row.id }),
                                copy.messages.rejected,
                              )
                            }
                          >
                            {copy.reject}
                          </Button>
                        </>
                      ) : null}
                      {owned && ['draft', 'awaiting_payment', 'active'].includes(row.status) ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={busy}
                          onClick={() =>
                            run(
                              row.id,
                              () => cancelFindHome({ requestId: row.id }),
                              copy.messages.cancelled,
                            )
                          }
                        >
                          {common.cancel}
                        </Button>
                      ) : null}
                      {canOperate && row.status === 'active' ? (
                        <>
                          <input
                            aria-label={copy.matchInputAria}
                            placeholder={copy.matchInputPlaceholder}
                            className="w-56 rounded-kuteka border border-slate-300 bg-white px-2 py-1 text-sm"
                            value={matchInputs[row.id] ?? ''}
                            onChange={(event) =>
                              setMatchInputs((current) => ({
                                ...current,
                                [row.id]: event.target.value,
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            loading={busy}
                            onClick={() =>
                              run(
                                row.id,
                                () =>
                                  matchFindHome({
                                    requestId: row.id,
                                    matchedPropertyId: matchInputs[row.id]?.trim() || null,
                                    notes: 'Casa proposta pela Kuteka.',
                                  }),
                                copy.messages.matched,
                              )
                            }
                          >
                            {copy.registerMatch}
                          </Button>
                        </>
                      ) : null}
                      {canOperate && ['active', 'matched'].includes(row.status) ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={busy}
                          onClick={() =>
                            run(
                              row.id,
                              () =>
                                failFindHome({
                                  requestId: row.id,
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
                        className="text-xs font-medium text-brand-700 hover:underline"
                        onClick={() => void toggleTimeline(row.id)}
                      >
                        {openTimeline === row.id ? common.hideTimeline : common.viewTimeline}
                      </button>
                    </div>

                    {openTimeline === row.id ? (
                      <ol className="space-y-1 rounded-kuteka bg-slate-50 p-3">
                        {(events[row.id] ?? []).map((event) => (
                          <li key={event.id} className="text-xs text-slate-600">
                            <strong>{event.event_type}</strong>
                            {event.from_status && event.to_status
                              ? ` · ${event.from_status} → ${event.to_status}`
                              : ''}
                            {event.note ? ` · ${event.note}` : ''}
                            {` · ${new Date(event.created_at).toLocaleString(dateLocale)}`}
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
