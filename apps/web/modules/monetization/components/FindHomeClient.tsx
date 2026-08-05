'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Badge, Button, Heading, Label, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { formatAoaAmount } from '@/modules/finance/lib/format';
import {
  FIND_HOME_TYPOLOGY_OPTIONS,
  findHomeStatusLabel,
  findHomeStatusTone,
  findHomeTypologyLabel,
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

function slaLabel(row: FindHomeRequestDetail): string | null {
  if (!row.sla_due_at || ['completed', 'cancelled', 'failed'].includes(row.status)) return null;
  if (row.sla_breached) return 'SLA ultrapassado';
  const hours = Math.round((new Date(row.sla_due_at).getTime() - Date.now()) / 3_600_000);
  if (hours <= 0) return 'SLA no limite';
  return hours < 48 ? `SLA em ${hours}h` : `SLA em ${Math.round(hours / 24)}d`;
}

export function FindHomeClient() {
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const ready = sessionStatus === 'ready';
  const [rows, setRows] = useState<FindHomeRequestDetail[]>([]);
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
  const [events, setEvents] = useState<Record<string, FindHomeEvent[]>>({});
  const [openTimeline, setOpenTimeline] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [requests, context, userResult] = await Promise.all([
      listFindHomeRequests(),
      fetchFindHomeContext(),
      createBrowserClient().auth.getUser(),
    ]);
    if (requests.ok) setRows(requests.data);
    else setError(requests.message);
    if (context.ok) setCanOperate(context.data.canOperate);
    setUid(userResult.data.user?.id ?? null);
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

  async function toggleTimeline(requestId: string) {
    if (openTimeline === requestId) {
      setOpenTimeline(null);
      return;
    }
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
    setMessage(null);
    const result = await createFindHomeRequest({
      province: province.trim() || null,
      municipality: municipality.trim() || null,
      typology,
      budgetMax: budget ? Number(budget) : null,
      notes: notes.trim() || null,
      preferences: { source: 'find_home_page' },
    });
    setBusyId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage('Procura prioritária activa. Taxa cobrada via Kuteka Pay (sandbox).');
    setNotes('');
    await load();
  }

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">Encontrar Casa</p>
          <Heading level={1}>Procura prioritária assistida</Heading>
          <Text className="mt-1 text-slate-700">
            Partilhe o que procura e a Kuteka coordena KAI e operadores. A prioridade tem uma única
            taxa via Kuteka Pay; explorar casas continua gratuito.
          </Text>
          {session?.email ? <p className="kuteka-detail-meta mt-2">{session.email}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/app/habitacao/explorar"
              className={cn(buttonVariants({ variant: 'secondary' }))}
            >
              Explorar gratuitamente
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
                <Label htmlFor="province">Província</Label>
                <input
                  id="province"
                  required
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={province}
                  onChange={(event) => setProvince(event.target.value)}
                  placeholder="Luanda"
                />
              </div>
              <div>
                <Label htmlFor="municipality">Município</Label>
                <input
                  id="municipality"
                  required
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={municipality}
                  onChange={(event) => setMunicipality(event.target.value)}
                  placeholder="Belas"
                />
              </div>
              <div>
                <Label htmlFor="typology">Tipologia</Label>
                <select
                  id="typology"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={typology}
                  onChange={(event) => setTypology(event.target.value as FindHomeTypologyValue)}
                >
                  {FIND_HOME_TYPOLOGY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="budget">Orçamento máximo (Kz)</Label>
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
                <Label htmlFor="notes">Preferências / notas</Label>
                <textarea
                  id="notes"
                  className="min-h-[80px] w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Zona, acessos, condições essenciais…"
                />
              </div>
              <Button type="submit" loading={busyId === 'create'} className="sm:col-span-2">
                Activar procura prioritária (sandbox)
              </Button>
            </form>
          </section>

          <section className="kuteka-detail-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="kuteka-detail-title">Pedidos</h2>
              {canOperate ? <Badge variant="default">Operador</Badge> : null}
            </div>
            <ul className="mt-3 divide-y divide-slate-200">
              {rows.map((row) => {
                const busy = busyId === row.id;
                const owned = row.client_id === uid;
                const timelineOpen = openTimeline === row.id;
                return (
                  <li key={row.id} className="flex flex-col gap-2 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {[row.province, row.municipality, findHomeTypologyLabel(row.typology)]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {row.budget_max_aoa
                            ? `Até ${formatAoaAmount(Number(row.budget_max_aoa))}`
                            : 'Orçamento aberto'}
                          {row.priority_amount_aoa
                            ? ` · prioridade ${formatAoaAmount(Number(row.priority_amount_aoa))}`
                            : ''}
                          {row.payment_intent_id ? ' · paga' : ''}
                          {slaLabel(row) ? ` · ${slaLabel(row)}` : ''}
                        </p>
                        {row.match_notes ? (
                          <p className="mt-1 text-sm text-slate-600">Match: {row.match_notes}</p>
                        ) : null}
                        {row.failure_reason ? (
                          <p className="mt-1 text-sm text-rose-700">Motivo: {row.failure_reason}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(row.created_at).toLocaleString('pt-PT')}
                        </p>
                      </div>
                      <Badge variant={findHomeStatusTone(row.status)}>
                        {findHomeStatusLabel(row.status)}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {owned && row.status === 'matched' ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            loading={busy}
                            onClick={() =>
                              run(
                                row.id,
                                () => acceptFindHomeMatch({ requestId: row.id }),
                                'Casa aceite. Pedido concluído sem taxa adicional.',
                              )
                            }
                          >
                            Aceitar casa
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            loading={busy}
                            onClick={() =>
                              run(
                                row.id,
                                () => rejectFindHomeMatch({ requestId: row.id }),
                                'Casa recusada. Procura retomada.',
                              )
                            }
                          >
                            Recusar
                          </Button>
                        </>
                      ) : null}
                      {owned && ['draft', 'awaiting_payment', 'active'].includes(row.status) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          loading={busy}
                          onClick={() =>
                            run(
                              row.id,
                              () => cancelFindHome({ requestId: row.id }),
                              'Pedido cancelado. Reembolso integral aplicado.',
                            )
                          }
                        >
                          Cancelar
                        </Button>
                      ) : null}
                      {canOperate && row.status === 'active' ? (
                        <>
                          <input
                            aria-label="ID do imóvel encontrado"
                            placeholder="ID do imóvel (opcional)"
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
                            type="button"
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
                                'Match registado. Cliente notificado.',
                              )
                            }
                          >
                            Registar match
                          </Button>
                        </>
                      ) : null}
                      {canOperate && ['active', 'matched'].includes(row.status) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          loading={busy}
                          onClick={() =>
                            run(
                              row.id,
                              () =>
                                failFindHome({ requestId: row.id, reason: 'SLA não cumprido.' }),
                              'Pedido falhado. Reembolso integral aplicado.',
                            )
                          }
                        >
                          Falhar (SLA)
                        </Button>
                      ) : null}
                      <button
                        type="button"
                        className="text-xs font-medium text-brand-700 underline-offset-2 hover:underline"
                        onClick={() => void toggleTimeline(row.id)}
                      >
                        {timelineOpen ? 'Ocultar cronologia' : 'Ver cronologia'}
                      </button>
                    </div>

                    {timelineOpen ? (
                      <ol className="mt-1 space-y-1 rounded-kuteka bg-slate-50 p-3">
                        {(events[row.id] ?? []).map((event) => (
                          <li key={event.id} className="text-xs text-slate-600">
                            <span className="font-medium text-slate-800">{event.event_type}</span>
                            {event.from_status &&
                            event.to_status &&
                            event.from_status !== event.to_status
                              ? ` · ${event.from_status} → ${event.to_status}`
                              : ''}
                            {event.note ? ` · ${event.note}` : ''}
                            <span className="ml-1 text-slate-400">
                              {new Date(event.created_at).toLocaleString('pt-PT')}
                            </span>
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
                <li className="py-3 text-sm text-slate-500">Ainda sem pedidos de procura.</li>
              ) : null}
            </ul>
          </section>
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
('use client');

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
  FIND_HOME_TYPOLOGY_OPTIONS,
  findHomeStatusLabel,
  findHomeStatusTone,
  findHomeTypologyLabel,
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

function slaLabel(row: FindHomeRequestDetail): string | null {
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

function locationLabel(row: FindHomeRequestDetail): string {
  const parts = [row.municipality, row.province].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Localização flexível';
}

/**
 * Encontrar Casa (Fase D2) — procura prioritária pay-per-use sobre a
 * infraestrutura financeira partilhada (Ledger + Kuteka Pay + reembolsos/créditos).
 * Uma única taxa de prioridade no arranque; cancelamento antes do match e falha
 * devolvem 100 % em créditos. Sem custódia, sem caminho de pagamento isolado.
 */
export function FindHomeClient() {
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const ready = sessionStatus === 'ready';
  const [rows, setRows] = useState<FindHomeRequestDetail[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [canOperate, setCanOperate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [province, setProvince] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [typology, setTypology] = useState<FindHomeTypologyValue | ''>('');
  const [budgetMax, setBudgetMax] = useState('');
  const [notes, setNotes] = useState('');
  const [matchInputs, setMatchInputs] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<Record<string, FindHomeEvent[]>>({});
  const [openTimeline, setOpenTimeline] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [req, ctx] = await Promise.all([listFindHomeRequests(), fetchFindHomeContext()]);
    if (req.ok) setRows(req.data);
    else setError(req.message);
    if (ctx.ok) setCanOperate(ctx.data.canOperate);

    const client = createBrowserClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    setUid(user?.id ?? null);
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
        const res = await listFindHomeEvents(requestId);
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
    const budget = budgetMax.trim() ? Number(budgetMax.replace(/[^\d.]/g, '')) : null;
    const result = await createFindHomeRequest({
      province: province.trim() || null,
      municipality: municipality.trim() || null,
      typology: typology || null,
      budgetMax: budget && budget > 0 ? budget : null,
      notes: notes.trim() || null,
      preferences: { source: 'find_home_page' },
    });
    setBusyId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage('Encontrar Casa activa. Taxa de prioridade capturada (sandbox). Procura em curso.');
    setProvince('');
    setMunicipality('');
    setTypology('');
    setBudgetMax('');
    setNotes('');
    await load();
  }

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">Encontrar Casa</p>
          <Heading level={1}>Procura prioritária de habitação</Heading>
          <Text className="mt-1 text-slate-700">
            Diga o que procura, pague a taxa de prioridade (sandbox) e a Kuteka coloca agentes e a
            rede a trabalhar no seu caso. Aceitar a casa encontrada não tem taxa extra. Explorar
            habitação continua gratuito.
          </Text>
          {session?.email ? <p className="kuteka-detail-meta mt-2">{session.email}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/app/habitacao/explorar"
              className={cn(buttonVariants({ variant: 'secondary' }))}
            >
              Explorar habitação
            </Link>
            <Link href="/app/mudanca" className={cn(buttonVariants({ variant: 'ghost' }))}>
              Mudança Inteligente
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
            <h2 className="kuteka-detail-title">Nova procura</h2>
            <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
              <div>
                <Label htmlFor="province">Província</Label>
                <input
                  id="province"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Ex.: Luanda"
                />
              </div>
              <div>
                <Label htmlFor="municipality">Município</Label>
                <input
                  id="municipality"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                  placeholder="Ex.: Belas"
                />
              </div>
              <div>
                <Label htmlFor="typology">Tipologia</Label>
                <select
                  id="typology"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={typology}
                  onChange={(e) => setTypology(e.target.value as FindHomeTypologyValue | '')}
                >
                  <option value="">Indiferente</option>
                  {FIND_HOME_TYPOLOGY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="budget">Orçamento máximo (AOA)</Label>
                <input
                  id="budget"
                  inputMode="numeric"
                  className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="Ex.: 250000"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Notas / preferências</Label>
                <textarea
                  id="notes"
                  className="min-h-[80px] w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Zona preferida, nº de quartos, condições…"
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" loading={busyId === 'create'}>
                  Activar procura prioritária (sandbox)
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
                          {findHomeTypologyLabel(r.typology)} · {locationLabel(r)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {r.priority_amount_aoa != null
                            ? `Prioridade ${formatAoaAmount(Number(r.priority_amount_aoa))}`
                            : 'Prioridade pendente'}
                          {r.payment_intent_id ? ' · paga' : ''}
                          {r.budget_max_aoa != null
                            ? ` · até ${formatAoaAmount(Number(r.budget_max_aoa))}`
                            : ''}
                          {sla ? ` · ${sla}` : ''}
                        </p>
                        {r.match_notes ? (
                          <p className="mt-1 text-sm text-slate-600">Casa: {r.match_notes}</p>
                        ) : null}
                        {r.failure_reason ? (
                          <p className="mt-1 text-sm text-rose-700">Motivo: {r.failure_reason}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(r.created_at).toLocaleString('pt-PT')}
                        </p>
                      </div>
                      <Badge variant={findHomeStatusTone(r.status)}>
                        {findHomeStatusLabel(r.status)}
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
                                () => acceptFindHomeMatch({ requestId: r.id }),
                                'Casa aceite. Procura concluída (sem taxa adicional).',
                              )
                            }
                          >
                            Aceitar casa
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            loading={busy}
                            onClick={() =>
                              run(
                                r.id,
                                () => rejectFindHomeMatch({ requestId: r.id }),
                                'Casa recusada. Procura retomada.',
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
                              () => cancelFindHome({ requestId: r.id }),
                              'Pedido cancelado. Prioridade devolvida em créditos.',
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
                                  matchFindHome({
                                    requestId: r.id,
                                    matchedPropertyId: matchInputs[r.id]?.trim() || null,
                                    notes: 'Casa compatível proposta pela Kuteka.',
                                  }),
                                'Casa registada. Cliente notificado.',
                              )
                            }
                          >
                            Registar casa
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
                                failFindHome({
                                  requestId: r.id,
                                  reason: 'Sem casa compatível dentro do SLA.',
                                }),
                              'Pedido marcado como sem solução. Prioridade devolvida em créditos.',
                            )
                          }
                        >
                          Sem solução (reembolsar)
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
                <li className="py-3 text-sm text-slate-500">Ainda sem pedidos de procura.</li>
              ) : null}
            </ul>
          </section>
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
