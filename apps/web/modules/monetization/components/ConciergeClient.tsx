'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Badge, Button, Heading, Label, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { formatAoaAmount } from '@/modules/finance/lib/format';
import {
  CONCIERGE_CATEGORY_OPTIONS,
  conciergeCategoryLabel,
  conciergeStatusLabel,
  conciergeStatusTone,
  type ConciergeCategoryValue,
} from '@/modules/monetization/lib/catalog';
import {
  cancelConcierge,
  completeConcierge,
  createConciergeRequest,
  failConcierge,
  fetchConciergeContext,
  listConciergeEvents,
  listConciergeRequests,
  startConcierge,
  type ConciergeEvent,
  type ConciergeRequestDetail,
} from '@/modules/monetization/services/concierge-client';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';

export function ConciergeClient() {
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const [rows, setRows] = useState<ConciergeRequestDetail[]>([]);
  const [events, setEvents] = useState<Record<string, ConciergeEvent[]>>({});
  const [openTimeline, setOpenTimeline] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [canOperate, setCanOperate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [category, setCategory] = useState<ConciergeCategoryValue>('housing_guidance');
  const [notes, setNotes] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [contractId, setContractId] = useState('');
  const [operatorNotes, setOperatorNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [requests, context, user] = await Promise.all([
      listConciergeRequests(),
      fetchConciergeContext(),
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
    const result = await createConciergeRequest({
      category,
      notes,
      propertyId: propertyId.trim() || null,
      contractId: contractId.trim() || null,
    });
    setBusyId(null);
    if (!result.ok) return setError(result.message);
    setMessage('Pedido activo. Taxa de serviço cobrada via Kuteka Pay (sandbox).');
    setNotes('');
    setPropertyId('');
    setContractId('');
    await load();
  }

  async function toggleTimeline(requestId: string) {
    if (openTimeline === requestId) return setOpenTimeline(null);
    setOpenTimeline(requestId);
    if (!events[requestId]) {
      const result = await listConciergeEvents(requestId);
      if (result.ok) setEvents((current) => ({ ...current, [requestId]: result.data }));
      else setError(result.message);
    }
  }

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">Concierge Kuteka</p>
          <Heading level={1}>Ajuda especializada, quando precisa</Heading>
          <Text className="mt-1 text-slate-700">
            Explique o pedido e a equipa Kuteka acompanha-o até à conclusão. A taxa única usa Kuteka
            Pay; cancelar antes do atendimento devolve o valor integral em créditos.
          </Text>
          {session?.email ? <p className="kuteka-detail-meta mt-2">{session.email}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/app/financeiro" className={cn(buttonVariants({ variant: 'secondary' }))}>
              Financeiro
            </Link>
            <Link href="/app/servicos" className={cn(buttonVariants({ variant: 'ghost' }))}>
              Prestadores
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
            <h2 className="kuteka-detail-title">Novo pedido</h2>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
              <div className="sm:col-span-2">
                <Label htmlFor="concierge-category">Categoria</Label>
                <select
                  id="concierge-category"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as ConciergeCategoryValue)}
                >
                  {CONCIERGE_CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="concierge-notes">Como podemos ajudar?</Label>
                <textarea
                  id="concierge-notes"
                  required
                  minLength={10}
                  maxLength={2000}
                  className="min-h-[110px] w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Descreva o resultado que pretende, contexto e prazos relevantes…"
                />
              </div>
              <div>
                <Label htmlFor="concierge-property">ID do imóvel (opcional)</Label>
                <input
                  id="concierge-property"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={propertyId}
                  onChange={(event) => setPropertyId(event.target.value)}
                  placeholder="UUID do imóvel"
                />
              </div>
              <div>
                <Label htmlFor="concierge-contract">ID do contrato (opcional)</Label>
                <input
                  id="concierge-contract"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={contractId}
                  onChange={(event) => setContractId(event.target.value)}
                  placeholder="UUID do contrato"
                />
              </div>
              <Button type="submit" loading={busyId === 'create'} className="sm:col-span-2">
                Pedir Concierge (sandbox)
              </Button>
            </form>
          </section>

          <section className="kuteka-detail-panel p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="kuteka-detail-title">Pedidos</h2>
              {canOperate ? <Badge variant="default">Operador</Badge> : null}
            </div>
            <ul className="mt-3 divide-y divide-slate-200">
              {rows.map((row) => {
                const owned = row.client_id === uid;
                const busy = busyId === row.id;
                return (
                  <li key={row.id} className="flex flex-col gap-3 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {conciergeCategoryLabel(row.category)}
                        </p>
                        <p className="mt-1 max-w-2xl text-sm text-slate-600">{row.notes}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.service_fee_aoa
                            ? `Taxa ${formatAoaAmount(Number(row.service_fee_aoa))}`
                            : 'Taxa pendente'}
                          {row.payment_intent_id ? ' · Kuteka Pay' : ''}
                          {row.property_id ? ` · imóvel ${row.property_id.slice(0, 8)}` : ''}
                          {row.contract_id ? ` · contrato ${row.contract_id.slice(0, 8)}` : ''}
                        </p>
                        {row.operator_notes ? (
                          <p className="mt-1 text-sm text-slate-600">
                            Operação: {row.operator_notes}
                          </p>
                        ) : null}
                        {row.failure_reason ? (
                          <p className="mt-1 text-sm text-rose-700">Motivo: {row.failure_reason}</p>
                        ) : null}
                      </div>
                      <Badge variant={conciergeStatusTone(row.status)}>
                        {conciergeStatusLabel(row.status)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {owned && ['draft', 'awaiting_payment', 'active'].includes(row.status) ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={busy}
                          onClick={() =>
                            run(
                              row.id,
                              () => cancelConcierge({ requestId: row.id }),
                              'Pedido cancelado. Reembolso integral aplicado em créditos.',
                            )
                          }
                        >
                          Cancelar
                        </Button>
                      ) : null}
                      {canOperate && ['active', 'in_progress'].includes(row.status) ? (
                        <input
                          aria-label="Nota do operador"
                          placeholder="Nota operacional (opcional)"
                          className="w-64 rounded-kuteka border border-slate-300 bg-white px-2 py-1 text-sm"
                          value={operatorNotes[row.id] ?? ''}
                          onChange={(event) =>
                            setOperatorNotes((current) => ({
                              ...current,
                              [row.id]: event.target.value,
                            }))
                          }
                        />
                      ) : null}
                      {canOperate && row.status === 'active' ? (
                        <Button
                          size="sm"
                          loading={busy}
                          onClick={() =>
                            run(
                              row.id,
                              () =>
                                startConcierge({
                                  requestId: row.id,
                                  note: operatorNotes[row.id] || null,
                                }),
                              'Atendimento iniciado.',
                            )
                          }
                        >
                          Iniciar
                        </Button>
                      ) : null}
                      {canOperate && row.status === 'in_progress' ? (
                        <Button
                          size="sm"
                          loading={busy}
                          onClick={() =>
                            run(
                              row.id,
                              () =>
                                completeConcierge({
                                  requestId: row.id,
                                  note: operatorNotes[row.id] || null,
                                }),
                              'Atendimento concluído.',
                            )
                          }
                        >
                          Concluir
                        </Button>
                      ) : null}
                      {canOperate && ['active', 'in_progress'].includes(row.status) ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={busy}
                          onClick={() =>
                            run(
                              row.id,
                              () =>
                                failConcierge({
                                  requestId: row.id,
                                  reason: operatorNotes[row.id] || 'Serviço não concluído.',
                                }),
                              'Pedido falhado. Reembolso integral aplicado em créditos.',
                            )
                          }
                        >
                          Marcar falha
                        </Button>
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
                <li className="py-3 text-sm text-slate-500">Ainda sem pedidos Concierge.</li>
              ) : null}
            </ul>
          </section>
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
