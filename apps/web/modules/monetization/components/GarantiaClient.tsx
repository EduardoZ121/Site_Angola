'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Badge, Button, Heading, Label, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { formatAoaAmount } from '@/modules/finance/lib/format';
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
    setMessage('Rascunho criado. Active quando estiver pronto para pagar.');
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
          <p className="kuteka-detail-eyebrow">Garantia Kuteka</p>
          <Heading level={1}>Protecção mensal opcional</Heading>
          <Text className="mt-1 text-slate-700">
            Cobertura por cerca de 3 500 Kz/mês, paga pela stack partilhada Kuteka Pay. O
            cancelamento termina a cobertura; no mesmo dia da activação, a mensalidade é devolvida
            integralmente em créditos.
          </Text>
          {session?.email ? <p className="kuteka-detail-meta mt-2">{session.email}</p> : null}
          <div className="mt-4">
            <Link href="/app/financeiro" className={cn(buttonVariants({ variant: 'secondary' }))}>
              Financeiro
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
            <h2 className="kuteka-detail-title">Nova subscrição</h2>
            <p className="kuteka-detail-body mt-1">
              Crie o rascunho e associe, se quiser, um imóvel ou contrato a que tem acesso.
            </p>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
              <div>
                <Label htmlFor="garantia-property">ID do imóvel (opcional)</Label>
                <input
                  id="garantia-property"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={propertyId}
                  onChange={(event) => setPropertyId(event.target.value)}
                  placeholder="UUID do imóvel"
                />
              </div>
              <div>
                <Label htmlFor="garantia-contract">ID do contrato (opcional)</Label>
                <input
                  id="garantia-contract"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={contractId}
                  onChange={(event) => setContractId(event.target.value)}
                  placeholder="UUID do contrato"
                />
              </div>
              <Button type="submit" loading={busyId === 'create'} className="sm:col-span-2">
                Criar rascunho
              </Button>
            </form>
          </section>

          <section className="kuteka-detail-panel p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="kuteka-detail-title">Subscrições</h2>
              {canOperate ? <Badge variant="default">Finanças</Badge> : null}
            </div>
            <ul className="mt-3 divide-y divide-slate-200">
              {rows.map((row) => {
                const owned = row.client_id === uid;
                const busy = busyId === row.id;
                return (
                  <li key={row.id} className="flex flex-col gap-3 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">Garantia mensal</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {row.monthly_amount_aoa
                            ? formatAoaAmount(Number(row.monthly_amount_aoa))
                            : '3 500 Kz/mês'}
                          {row.payment_intent_id ? ' · Kuteka Pay' : ''}
                          {row.property_id ? ` · imóvel ${row.property_id.slice(0, 8)}` : ''}
                          {row.contract_id ? ` · contrato ${row.contract_id.slice(0, 8)}` : ''}
                        </p>
                        {row.coverage_starts_at ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Cobertura:{' '}
                            {new Date(row.coverage_starts_at).toLocaleDateString('pt-PT')}
                            {row.coverage_ends_at
                              ? ` — ${new Date(row.coverage_ends_at).toLocaleDateString('pt-PT')}`
                              : ''}
                          </p>
                        ) : null}
                        {row.status_reason ? (
                          <p className="mt-1 text-sm text-rose-700">Motivo: {row.status_reason}</p>
                        ) : null}
                      </div>
                      <Badge variant={garantiaStatusTone(row.status)}>
                        {garantiaStatusLabel(row.status)}
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
                              'Garantia activa. Mensalidade cobrada via Kuteka Pay (sandbox).',
                            )
                          }
                        >
                          Activar e pagar
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
                              'Garantia cancelada. O reembolso é aplicado quando elegível.',
                            )
                          }
                        >
                          Cancelar
                        </Button>
                      ) : null}
                      {canOperate &&
                      ['awaiting_payment', 'active', 'past_due'].includes(row.status) ? (
                        <>
                          <input
                            aria-label="Motivo do estado"
                            placeholder="Motivo (opcional)"
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
                                  'Subscrição marcada com pagamento em atraso.',
                                )
                              }
                            >
                              Em atraso
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
                                'Subscrição marcada como falhada.',
                              )
                            }
                          >
                            Marcar falha
                          </Button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        className="text-xs font-medium text-brand-700 hover:underline"
                        onClick={() => void toggleTimeline(row.id)}
                      >
                        {openTimeline === row.id ? 'Ocultar cronologia' : 'Ver cronologia'}
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
                            {` · ${new Date(timelineEvent.created_at).toLocaleString('pt-PT')}`}
                          </li>
                        ))}
                        {(events[row.id] ?? []).length === 0 ? (
                          <li className="text-xs text-slate-500">Sem eventos.</li>
                        ) : null}
                      </ol>
                    ) : null}
                  </li>
                );
              })}
              {rows.length === 0 ? (
                <li className="py-3 text-sm text-slate-500">Ainda sem subscrições Garantia.</li>
              ) : null}
            </ul>
          </section>
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
