'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Badge, Button, Heading, Label, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { formatAoaAmount } from '@/modules/finance/lib/format';
import {
  URGENCY_OPTIONS,
  smartMoveStatusLabel,
  smartMoveStatusTone,
  urgencyLabel,
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

function slaLabel(row: SmartMoveRequestDetail): string | null {
  if (!row.sla_due_at) return null;
  if (row.sla_breached) return 'SLA ultrapassado';
  if (row.status === 'completed' || row.status === 'cancelled' || row.status === 'failed') {
    return null;
  }
  const hours = Math.round((new Date(row.sla_due_at).getTime() - Date.now()) / 3_600_000);
  if (hours <= 0) return 'SLA no limite';
  if (hours < 48) return `SLA em ${hours}h`;
  return `SLA em ${Math.round(hours / 24)}d`;
}

/**
 * Mudança Inteligente N5 — pipeline completo sobre a infraestrutura financeira
 * partilhada (Ledger + Kuteka Pay + reembolsos/créditos). Abertura no arranque,
 * sucesso só quando a Kuteka encontra solução aceite, reembolso por urgência.
 */
export function SmartMoveClient() {
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
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

  const load = useCallback(async () => {
    setLoading(true);
    const [req, ctx] = await Promise.all([listSmartMoveRequests(), fetchSmartMoveContext()]);
    if (req.ok) setRows(req.data);
    else setError(req.message);
    if (ctx.ok) setCanOperate(ctx.data.canOperate);

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
    setMessage(
      'Mudança Inteligente activa. Taxa de abertura capturada (sandbox). Pipeline em curso.',
    );
    setNotes('');
    await load();
  }

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">Mudança Inteligente</p>
          <Heading level={1}>Procura assistida por urgência</Heading>
          <Text className="mt-1 text-slate-700">
            Informe a saída, pague a taxa de abertura (sandbox) e a Kuteka activa parceiro, agentes
            e KAI. A taxa de sucesso só é cobrada quando aceita uma solução. Explorar casas continua
            gratuito.
          </Text>
          {session?.email ? <p className="kuteka-detail-meta mt-2">{session.email}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/app/servicos" className={cn(buttonVariants({ variant: 'secondary' }))}>
              Rede de prestadores
            </Link>
            <Link href="/app/financeiro" className={cn(buttonVariants({ variant: 'ghost' }))}>
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
            <h2 className="kuteka-detail-title">Novo pedido</h2>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
              <div>
                <Label htmlFor="urgency">Urgência</Label>
                <select
                  id="urgency"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as SmartMoveUrgency)}
                >
                  {URGENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="contract">Contrato (opcional)</Label>
                <select
                  id="contract"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                >
                  <option value="">Sem vínculo</option>
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} · {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Preferências / notas</Label>
                <textarea
                  id="notes"
                  className="min-h-[80px] w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Zona, tipologia, orçamento…"
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" loading={busyId === 'create'}>
                  Activar Mudança Inteligente (sandbox)
                </Button>
              </div>
            </form>
          </section>

          <section className="kuteka-detail-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="kuteka-detail-title">Pedidos</h2>
              {canOperate ? <Badge variant="default">Operador (agente / finance)</Badge> : null}
            </div>
            <ul className="mt-3 divide-y divide-slate-200">
              {rows.map((r) => {
                const busy = busyId === r.id;
                const owned = r.client_id === uid;
                const sla = slaLabel(r);
                const timelineOpen = openTimeline === r.id;
                return (
                  <li key={r.id} className="flex flex-col gap-2 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {urgencyLabel(r.urgency_band)} · saída {r.target_exit_on}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {r.opening_amount_aoa != null
                            ? `Abertura ${formatAoaAmount(Number(r.opening_amount_aoa))}`
                            : 'Abertura pendente'}
                          {r.opening_payment_intent_id ? ' · paga' : ''}
                          {r.success_amount_aoa != null
                            ? ` · sucesso ${formatAoaAmount(Number(r.success_amount_aoa))}`
                            : ''}
                          {r.success_charged_at ? ' (cobrada)' : ''}
                          {sla ? ` · ${sla}` : ''}
                        </p>
                        {r.match_notes ? (
                          <p className="mt-1 text-sm text-slate-600">Solução: {r.match_notes}</p>
                        ) : null}
                        {r.failure_reason ? (
                          <p className="mt-1 text-sm text-rose-700">Motivo: {r.failure_reason}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(r.created_at).toLocaleString('pt-PT')}
                          {r.partner_notified_at ? ' · parceiro notificado' : ''}
                          {r.agent_task_created_at ? ' · tarefa agente' : ''}
                        </p>
                      </div>
                      <Badge variant={smartMoveStatusTone(r.status)}>
                        {smartMoveStatusLabel(r.status)}
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
                                'Solução aceite. Taxa de sucesso cobrada via Kuteka Pay.',
                              )
                            }
                          >
                            Aceitar e pagar sucesso
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
                                'Solução recusada. Procura retomada.',
                              )
                            }
                          >
                            Recusar
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
                              'Pedido cancelado. Abertura devolvida em créditos.',
                            )
                          }
                        >
                          Cancelar
                        </Button>
                      ) : null}

                      {canOperate && r.status === 'active' ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            aria-label="ID do imóvel encontrado (opcional)"
                            placeholder="ID do imóvel (opcional)"
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
                                'Match registado. Cliente notificado.',
                              )
                            }
                          >
                            Registar match
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
                                  reason: 'SLA não cumprido.',
                                }),
                              'Pedido marcado como falhado. Reembolso por urgência aplicado.',
                            )
                          }
                        >
                          Falhar (SLA)
                        </Button>
                      ) : null}

                      <button
                        type="button"
                        className="text-xs font-medium text-brand-700 underline-offset-2 hover:underline"
                        onClick={() => toggleTimeline(r.id)}
                      >
                        {timelineOpen ? 'Ocultar cronologia' : 'Ver cronologia'}
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
                              {new Date(ev.created_at).toLocaleString('pt-PT')}
                            </span>
                          </li>
                        ))}
                        {(events[r.id] ?? []).length === 0 ? (
                          <li className="text-xs text-slate-500">Sem eventos.</li>
                        ) : null}
                      </ol>
                    ) : null}
                  </li>
                );
              })}
              {rows.length === 0 ? (
                <li className="py-3 text-sm text-slate-500">Ainda sem pedidos de mudança.</li>
              ) : null}
            </ul>
          </section>
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
