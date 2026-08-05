'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { EXIT_REASONS, MAINTENANCE_CATEGORIES, formatAoa, formatDays } from '../format';
import { loadOpsStats } from '../load-ops-stats';
import type { OpsContract, OpsStats } from '../types';

/**
 * Cliente residente — contrato, pagamentos, manutenção e intenção de saída.
 */
export function ResidentOpsClient() {
  const [stats, setStats] = useState<OpsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [exitDays, setExitDays] = useState('60');
  const [exitReason, setExitReason] = useState('mudanca_cidade');
  const [maintCategory, setMaintCategory] = useState('maintenance');
  const [maintTitle, setMaintTitle] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const client = createBrowserClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }
    const data = await loadOpsStats(user.id);
    setStats(data);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const active: OpsContract | undefined = stats?.clientContracts.find((c) => c.status === 'active');

  async function submitExitIntent() {
    if (!active) return;
    setBusy(true);
    setMessage(null);
    try {
      const client = createBrowserClient();
      const days = exitDays === 'custom' ? 45 : Number(exitDays);
      const date = new Date();
      date.setDate(date.getDate() + (Number.isFinite(days) ? days : 45));
      const exit_intent_date = date.toISOString().slice(0, 10);
      const { error } = await client.rpc('set_contract_exit_intent', {
        p_contract_id: active.id,
        p_exit_intent: 'confirmed',
        p_exit_intent_date: exit_intent_date,
        p_exit_reason: exitReason,
        p_exit_notes: `Intenção de saída em ${days} dias.`,
      });
      if (error) throw error;
      setMessage(
        'Intenção de saída registada. A Kuteka pode iniciar a procura de novos interessados.',
      );
      await refresh();
    } catch {
      setMessage('Não conseguimos guardar a intenção de saída. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function submitMaintenance() {
    if (!active || !maintTitle.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const client = createBrowserClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) throw new Error('auth');
      const { data: contract } = await client
        .from('property_contracts')
        .select('property_id, partner_id')
        .eq('id', active.id)
        .maybeSingle();
      const { error } = await client.from('maintenance_requests').insert({
        property_id: contract?.property_id ?? active.propertyId,
        contract_id: active.id,
        client_id: user.id,
        partner_id: contract?.partner_id ?? null,
        category: maintCategory,
        title: maintTitle.trim(),
        description: 'Pedido criado no cockpit do cliente.',
        status: 'requested',
        created_by: user.id,
        updated_by: user.id,
      });
      if (error) throw error;
      setMaintTitle('');
      setMessage('Pedido de serviço enviado ao parceiro / rede Kuteka.');
      await refresh();
    } catch {
      setMessage('Não conseguimos criar o pedido. Verifique a sua conta ou tente mais tarde.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="kuteka-detail-panel p-5">
        <p className="kuteka-detail-eyebrow">Cliente · Residência</p>
        <Heading level={1}>Gestão da habitação</Heading>
        <Text className="mt-1 text-slate-700">
          Contrato actual, pagamentos, calendário, comunicações e intenção de saída.
        </Text>
      </header>

      {message ? (
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {message}
        </div>
      ) : null}

      {loading ? <p className="kuteka-detail-meta">A carregar cockpit…</p> : null}

      {!loading && !active ? (
        <section className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-body">
            Ainda não tem um contrato activo. Explore habitação ou acompanhe propostas.
          </p>
          <Link
            href="/app/habitacao/explorar"
            className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'mt-3 w-fit')}
          >
            Explorar Habitação
          </Link>
        </section>
      ) : null}

      {active ? (
        <>
          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">Contrato actual</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Estado', value: active.status },
                { label: 'Início', value: active.startsOn ?? '—' },
                { label: 'Término', value: active.endsOn ?? '—' },
                { label: 'Dias restantes', value: formatDays(active.daysRemaining) },
                {
                  label: 'Renda / valor',
                  value: formatAoa(active.nextPaymentAmountAoa ?? active.amountAoa / 12),
                },
                { label: 'Caução', value: formatAoa(active.depositAoa) },
                { label: 'Próximo pagamento', value: active.nextPaymentDue ?? '—' },
                { label: 'Dias até pagar', value: formatDays(active.daysUntilPayment) },
              ].map((item) => (
                <li key={item.label} className="kuteka-role-stat">
                  <p className="kuteka-role-stat__value">{item.value}</p>
                  <p className="kuteka-role-stat__label">{item.label}</p>
                </li>
              ))}
            </ul>
            <p className="kuteka-detail-meta mt-3">
              {active.propertyTitle} · {active.propertyCode} · Pagamentos:{' '}
              {stats?.paymentsPaid ?? 0} pagos · {stats?.paymentsPending ?? 0} pendentes ·{' '}
              {stats?.paymentsLate ?? 0} em atraso
            </p>
          </section>

          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">Solicitar serviço</h2>
            <p className="kuteka-detail-body mt-1">
              Manutenção, limpeza, remodelação, pintura, eletricidade ou canalização.
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <select
                className="kuteka-ops-input"
                value={maintCategory}
                onChange={(e) => setMaintCategory(e.target.value)}
              >
                {MAINTENANCE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                className="kuteka-ops-input flex-1"
                placeholder="Descreva o pedido"
                value={maintTitle}
                onChange={(e) => setMaintTitle(e.target.value)}
              />
              <button
                type="button"
                disabled={busy || !maintTitle.trim()}
                className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
                onClick={() => void submitMaintenance()}
              >
                Enviar
              </button>
            </div>
          </section>

          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">Intenção de saída</h2>
            <p className="kuteka-detail-body mt-1">
              Informe com antecedência para a Kuteka procurar novos interessados, organizar visitas
              e facilitar a devolução da caução.
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <select
                className="kuteka-ops-input"
                value={exitDays}
                onChange={(e) => setExitDays(e.target.value)}
              >
                <option value="30">Pretendo sair em 30 dias</option>
                <option value="60">Pretendo sair em 60 dias</option>
                <option value="90">Pretendo sair em 90 dias</option>
                <option value="custom">Data personalizada (~45 dias)</option>
              </select>
              <select
                className="kuteka-ops-input"
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
              >
                {EXIT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={busy}
                className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
                onClick={() => void submitExitIntent()}
              >
                Registar intenção
              </button>
            </div>
            {active.exitIntent !== 'none' ? (
              <p className="kuteka-detail-meta mt-3">
                Estado actual: {active.exitIntent}
                {active.exitIntentDate ? ` · ${active.exitIntentDate}` : ''}
                {active.exitReason ? ` · ${active.exitReason}` : ''}
              </p>
            ) : null}
            <Link
              href="/app/mudanca"
              className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'mt-4 w-fit')}
            >
              Activar Mudança Inteligente
            </Link>
          </section>

          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">Rede de prestadores</h2>
            <p className="kuteka-detail-body mt-1">
              Pedidos de limpeza, mudanças e obras com comissão Kuteka (marketplace).
            </p>
            <Link
              href="/app/servicos"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-3 w-fit')}
            >
              Abrir marketplace
            </Link>
          </section>
        </>
      ) : null}
    </div>
  );
}
