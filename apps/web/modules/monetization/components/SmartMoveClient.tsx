'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Badge, Button, Heading, Label, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import {
  URGENCY_OPTIONS,
  createSmartMoveRequest,
  listSmartMoveRequests,
  type SmartMoveRequestRow,
  type SmartMoveUrgency,
} from '@/modules/monetization/services/monetization-client';

function statusVariant(status: string): 'success' | 'warning' | 'default' {
  if (status === 'active' || status === 'matched' || status === 'completed') return 'success';
  if (status === 'awaiting_payment' || status === 'draft') return 'warning';
  return 'default';
}

/**
 * Mudança Inteligente — pay-per-use opening fee + pipeline N5.
 */
export function SmartMoveClient() {
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const ready = sessionStatus === 'ready';
  const [rows, setRows] = useState<SmartMoveRequestRow[]>([]);
  const [contracts, setContracts] = useState<{ id: string; code: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<SmartMoveUrgency>('urgent_30');
  const [contractId, setContractId] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [req, client] = await Promise.all([
      listSmartMoveRequests(),
      Promise.resolve(createBrowserClient()),
    ]);
    if (req.ok) setRows(req.data);
    else setError(req.message);

    const {
      data: { user },
    } = await client.auth.getUser();
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
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
    setBusy(false);
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
            e KAI. Explorar casas continua gratuito.
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
                <Button type="submit" loading={busy}>
                  Activar Mudança Inteligente (sandbox)
                </Button>
              </div>
            </form>
          </section>

          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">Pedidos</h2>
            <ul className="mt-3 divide-y divide-slate-200">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      {r.urgency_band} · saída {r.target_exit_on}
                    </p>
                    <p className="text-sm text-slate-600">{r.kai_notes ?? '—'}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleString('pt-PT')}
                      {r.partner_notified_at ? ' · parceiro notificado' : ''}
                      {r.agent_task_created_at ? ' · tarefa agente' : ''}
                    </p>
                  </div>
                  <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                </li>
              ))}
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
