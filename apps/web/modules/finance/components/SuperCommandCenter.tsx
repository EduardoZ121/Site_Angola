'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { FINANCE_URGENCY_BANDS } from '@kuteka/validation';
import { Badge, Button, Heading, Input, Label, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { ForbiddenPanel } from '@/modules/shell/components/ForbiddenPanel';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../content/pt';
import {
  captureSandboxPayment,
  createSandboxPayment,
  fetchRevenueSnapshot,
  formatAoaAmount,
  grantCredits,
  listCommissions,
  listFinanceProducts,
  listGateways,
  listInvoices,
  listLedgerEntries,
  listPriceRules,
  updatePriceRule,
  type FinanceCommissionRow,
  type FinanceGatewayRow,
  type FinanceInvoiceRow,
  type FinanceLedgerRow,
  type FinancePriceRuleRow,
  type FinanceProductRow,
  type RevenueSnapshot,
} from '../services/finance-client';
import {
  listFeatureFlags,
  setFeatureFlag,
  type FeatureFlagRow,
} from '@/modules/monetization/services/monetization-client';

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-kuteka border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

export function SuperCommandCenter() {
  const copy = getFinanceCopy();
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const canManage = sessionStatus === 'ready' && !!session?.permissions.includes('finance.manage');
  const canRead =
    sessionStatus === 'ready' &&
    (!!session?.permissions.includes('finance.read') ||
      !!session?.permissions.includes('finance.manage'));
  const accessPending = sessionStatus === 'loading';
  const denied = sessionStatus === 'ready' && !canRead;

  const [snapshot, setSnapshot] = useState<RevenueSnapshot | null>(null);
  const [products, setProducts] = useState<FinanceProductRow[]>([]);
  const [rules, setRules] = useState<FinancePriceRuleRow[]>([]);
  const [ledger, setLedger] = useState<FinanceLedgerRow[]>([]);
  const [gateways, setGateways] = useState<FinanceGatewayRow[]>([]);
  const [commissions, setCommissions] = useState<FinanceCommissionRow[]>([]);
  const [invoices, setInvoices] = useState<FinanceInvoiceRow[]>([]);
  const [flags, setFlags] = useState<FeatureFlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [sandboxProduct, setSandboxProduct] = useState('smart_move.open');
  const [sandboxUrgency, setSandboxUrgency] =
    useState<(typeof FINANCE_URGENCY_BANDS)[number]>('urgent_30');
  const [lastIntentId, setLastIntentId] = useState<string | null>(null);
  const [creditUserId, setCreditUserId] = useState('');
  const [creditAmount, setCreditAmount] = useState('2000');
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({});

  const productName = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p.name]));
    return (id: string) => map.get(id) ?? id.slice(0, 8);
  }, [products]);

  const load = useCallback(async () => {
    if (!canRead) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [snap, prods, priceRules, led, gws, comms, invs, fl] = await Promise.all([
      fetchRevenueSnapshot(),
      listFinanceProducts(),
      listPriceRules(),
      listLedgerEntries(40),
      listGateways(),
      listCommissions(),
      listInvoices(20),
      listFeatureFlags(),
    ]);
    if (!snap.ok) setError(snap.message);
    else {
      setError(null);
      setSnapshot(snap.data);
    }
    if (prods.ok) setProducts(prods.data);
    if (priceRules.ok) {
      setRules(priceRules.data);
      const edits: Record<string, string> = {};
      for (const r of priceRules.data) {
        edits[r.id] = r.amount != null ? String(r.amount) : '';
      }
      setPriceEdits(edits);
    }
    if (led.ok) setLedger(led.data);
    if (gws.ok) setGateways(gws.data);
    if (comms.ok) setCommissions(comms.data);
    if (invs.ok) setInvoices(invs.data);
    if (fl.ok) setFlags(fl.data);
    const {
      data: { user },
    } = await createBrowserClient().auth.getUser();
    if (user?.id) setCreditUserId(user.id);
    setLoading(false);
  }, [canRead]);

  useEffect(() => {
    if (sessionStatus === 'ready') void load();
    if (sessionStatus === 'error') setLoading(false);
  }, [load, sessionStatus]);

  async function onSandboxPay(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy('pay');
    setMessage(null);
    setError(null);
    const created = await createSandboxPayment({
      productCode: sandboxProduct,
      urgencyBand: sandboxUrgency,
      gatewayCode: 'sandbox',
    });
    if (!created.ok) {
      setBusy(null);
      setError(created.message);
      return;
    }
    const intentId = String(created.data.paymentIntentId ?? '');
    setLastIntentId(intentId);
    const captured = await captureSandboxPayment({ paymentIntentId: intentId });
    setBusy(null);
    if (!captured.ok) {
      setError(captured.message);
      return;
    }
    setMessage(
      `Pagamento sandbox capturado. Fatura ${String(captured.data.invoiceNumber ?? '—')}.`,
    );
    await load();
  }

  async function onGrantCredits(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy('credits');
    setMessage(null);
    setError(null);
    const result = await grantCredits({
      userId: creditUserId,
      amount: Number(creditAmount),
      reason: 'Concessão Super Admin',
    });
    setBusy(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(`Créditos concedidos. Saldo: ${String(result.data.balance ?? '—')}`);
    await load();
  }

  async function onSavePrice(ruleId: string) {
    if (!canManage) return;
    setBusy(`price-${ruleId}`);
    setError(null);
    const amount = Number(priceEdits[ruleId]);
    const result = await updatePriceRule({ id: ruleId, amount });
    setBusy(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage('Preço actualizado.');
    await load();
  }

  async function onToggleFlag(code: string, enabled: boolean) {
    if (!canManage) return;
    setBusy(`flag-${code}`);
    setError(null);
    const result = await setFeatureFlag(code, enabled);
    setBusy(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(`Flag ${code} → ${enabled ? 'ON' : 'OFF'}`);
    await load();
  }

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">{copy.eyebrow}</p>
          <Heading level={1}>{copy.superTitle}</Heading>
          <Text className="mt-1 text-slate-700">{copy.superSubtitle}</Text>
          <p className="kuteka-detail-meta mt-2">{copy.custodyNote}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/app/admin" className={cn(buttonVariants({ variant: 'secondary' }))}>
              Admin operacional
            </Link>
            <Link href="/app/mudanca" className={cn(buttonVariants({ variant: 'ghost' }))}>
              Mudança Inteligente
            </Link>
            <Link href="/app/servicos" className={cn(buttonVariants({ variant: 'ghost' }))}>
              Prestadores
            </Link>
            <Link href="/app/parceiro/planos" className={cn(buttonVariants({ variant: 'ghost' }))}>
              Planos Parceiro
            </Link>
            <Link href="/app/perfil" className={cn(buttonVariants({ variant: 'ghost' }))}>
              Perfil / KYC
            </Link>
            <a
              href="https://github.com/EduardoZ121/Site_Angola/blob/main/docs/finance/ARQUITETURA_FINANCEIRA_KUTEKA.md"
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: 'ghost' }))}
            >
              Arquitectura financeira
            </a>
          </div>
        </header>

        {accessPending ? <SoftListSlot pending /> : null}
        {denied ? <ForbiddenPanel message={copy.forbidden} /> : null}

        {error ? (
          <p className="rounded-kuteka border border-rose-300/40 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-kuteka border border-emerald-300/40 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {message}
          </p>
        ) : null}

        {canRead ? (
          <SoftListSlot pending={loading && !snapshot}>
            {/* Revenue */}
            <section className="kuteka-detail-panel p-5" aria-labelledby="rev">
              <h2 id="rev" className="kuteka-detail-title">
                {copy.sections.revenue}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric
                  label={copy.metrics.captured}
                  value={formatAoaAmount(snapshot?.capturedCharges ?? 0)}
                />
                <Metric
                  label={copy.metrics.pending}
                  value={formatAoaAmount(snapshot?.pendingCharges ?? 0)}
                />
                <Metric
                  label={copy.metrics.commissions}
                  value={formatAoaAmount(snapshot?.commissions ?? 0)}
                />
                <Metric
                  label={copy.metrics.credits}
                  value={formatAoaAmount(snapshot?.creditsGranted ?? 0)}
                />
                <Metric
                  label={copy.metrics.intents}
                  value={String(snapshot?.paymentIntents ?? 0)}
                />
                <Metric label={copy.metrics.invoices} value={String(snapshot?.invoices ?? 0)} />
                <Metric
                  label={copy.metrics.products}
                  value={String(snapshot?.activeProducts ?? 0)}
                />
                <Metric
                  label={copy.metrics.gateways}
                  value={String(snapshot?.sandboxGateways ?? 0)}
                />
              </div>
            </section>

            {/* Service Health / feature flags */}
            <section className="kuteka-detail-panel p-5" aria-labelledby="flags">
              <h2 id="flags" className="kuteka-detail-title">
                Service Health
              </h2>
              <p className="kuteka-detail-body mt-1">
                Ligar / desligar módulos comerciais sem deploy.
              </p>
              <ul className="mt-3 divide-y divide-slate-200">
                {flags.map((f) => (
                  <li
                    key={f.code}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{f.label}</p>
                      <p className="text-sm text-slate-600">{f.description}</p>
                      <p className="font-mono text-xs text-slate-500">{f.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={f.enabled ? 'success' : 'warning'}>
                        {f.enabled ? 'ON' : 'OFF'}
                      </Badge>
                      {canManage ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          loading={busy === `flag-${f.code}`}
                          onClick={() => void onToggleFlag(f.code, !f.enabled)}
                        >
                          {f.enabled ? 'Desligar' : 'Ligar'}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
                {flags.length === 0 ? (
                  <li className="py-3 text-sm text-slate-500">
                    Sem flags (aplicar migration 0020).
                  </li>
                ) : null}
              </ul>
            </section>

            {/* Sandbox pay */}
            {canManage ? (
              <section className="kuteka-detail-panel p-5" aria-labelledby="sandbox">
                <h2 id="sandbox" className="kuteka-detail-title">
                  {copy.sections.sandbox}
                </h2>
                <p className="kuteka-detail-body mt-1">{copy.sandboxHint}</p>
                <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={onSandboxPay}>
                  <div>
                    <Label htmlFor="sandboxProduct">Produto</Label>
                    <select
                      id="sandboxProduct"
                      className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                      value={sandboxProduct}
                      onChange={(e) => setSandboxProduct(e.target.value)}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.code}>
                          {p.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="sandboxUrgency">Urgência</Label>
                    <select
                      id="sandboxUrgency"
                      className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                      value={sandboxUrgency}
                      onChange={(e) =>
                        setSandboxUrgency(e.target.value as (typeof FINANCE_URGENCY_BANDS)[number])
                      }
                    >
                      <option value="planned_90">61–90 dias</option>
                      <option value="priority_60">31–60 dias</option>
                      <option value="urgent_30">15–30 dias</option>
                      <option value="emergency_14">1–14 dias</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button type="submit" loading={busy === 'pay'}>
                      {copy.pay} + {copy.capture}
                    </Button>
                  </div>
                </form>
                {lastIntentId ? (
                  <p className="mt-2 font-mono text-xs text-slate-500">Intent: {lastIntentId}</p>
                ) : null}
              </section>
            ) : null}

            {/* Credits */}
            {canManage ? (
              <section className="kuteka-detail-panel p-5" aria-labelledby="credits">
                <h2 id="credits" className="kuteka-detail-title">
                  {copy.sections.credits}
                </h2>
                <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={onGrantCredits}>
                  <div className="sm:col-span-2">
                    <Label htmlFor="creditUser">User ID</Label>
                    <Input
                      id="creditUser"
                      value={creditUserId}
                      onChange={(e) => setCreditUserId(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="creditAmount">Montante (Kz)</Label>
                    <Input
                      id="creditAmount"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      required
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Button type="submit" loading={busy === 'credits'}>
                      {copy.grantCredits}
                    </Button>
                  </div>
                </form>
              </section>
            ) : null}

            {/* Products */}
            <section className="kuteka-detail-panel p-5" aria-labelledby="products">
              <h2 id="products" className="kuteka-detail-title">
                {copy.sections.products}
              </h2>
              <ul className="mt-3 divide-y divide-slate-200">
                {products.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium text-slate-900">{p.name}</p>
                      <p className="font-mono text-xs text-slate-500">{p.code}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="default">{p.category}</Badge>
                      <Badge variant={p.active ? 'success' : 'warning'}>
                        {p.active ? 'Activo' : 'Off'}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Prices */}
            <section className="kuteka-detail-panel p-5" aria-labelledby="prices">
              <h2 id="prices" className="kuteka-detail-title">
                {copy.sections.prices}
              </h2>
              <ul className="mt-3 flex flex-col gap-3">
                {rules.slice(0, 16).map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-col gap-2 rounded-kuteka border border-slate-200 p-3 sm:flex-row sm:items-end sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{r.label}</p>
                      <p className="text-xs text-slate-500">
                        {productName(r.product_id)} · {r.code} · {r.charge_event}
                        {r.urgency_band ? ` · ${r.urgency_band}` : ''}
                      </p>
                    </div>
                    {canManage ? (
                      <div className="flex items-end gap-2">
                        <div>
                          <Label htmlFor={`price-${r.id}`}>AOA</Label>
                          <Input
                            id={`price-${r.id}`}
                            className="w-28"
                            value={priceEdits[r.id] ?? ''}
                            onChange={(e) =>
                              setPriceEdits((prev) => ({ ...prev, [r.id]: e.target.value }))
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          loading={busy === `price-${r.id}`}
                          onClick={() => void onSavePrice(r.id)}
                        >
                          {copy.savePrice}
                        </Button>
                      </div>
                    ) : (
                      <p className="font-semibold tabular-nums">
                        {formatAoaAmount(Number(r.amount ?? 0), r.currency)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {/* Commissions */}
            <section className="kuteka-detail-panel p-5" aria-labelledby="comms">
              <h2 id="comms" className="kuteka-detail-title">
                {copy.sections.commissions}
              </h2>
              <ul className="mt-3 divide-y divide-slate-200">
                {commissions.map((c) => (
                  <li key={c.id} className="flex justify-between gap-3 py-2 text-sm">
                    <span>
                      {c.label} <span className="text-slate-500">({c.payer_side})</span>
                    </span>
                    <span className="font-semibold tabular-nums">
                      {c.take_rate_pct != null
                        ? `${c.take_rate_pct}%`
                        : formatAoaAmount(c.fixed_amount ?? 0)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Gateways */}
            <section className="kuteka-detail-panel p-5" aria-labelledby="gateways">
              <h2 id="gateways" className="kuteka-detail-title">
                {copy.sections.gateways}
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {gateways.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center justify-between rounded-kuteka border border-slate-200 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{g.name}</p>
                      <p className="font-mono text-xs text-slate-500">{g.code}</p>
                    </div>
                    <div className="flex gap-1">
                      {g.sandbox ? <Badge variant="warning">Sandbox</Badge> : null}
                      <Badge variant={g.active ? 'success' : 'default'}>
                        {g.active ? 'On' : 'Off'}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Ledger */}
            <section className="kuteka-detail-panel p-5" aria-labelledby="ledger">
              <h2 id="ledger" className="kuteka-detail-title">
                {copy.sections.ledger}
              </h2>
              <ul className="mt-3 divide-y divide-slate-200">
                {ledger.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {row.entry_type} · {row.description ?? '—'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(row.created_at).toLocaleString('pt-PT')} ·{' '}
                        {row.gateway_code ?? '—'} · custody={row.custody_mode}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          row.status === 'captured'
                            ? 'success'
                            : row.status === 'pending'
                              ? 'warning'
                              : 'default'
                        }
                      >
                        {row.status}
                      </Badge>
                      <span className="font-semibold tabular-nums">
                        {formatAoaAmount(Number(row.amount), row.currency)}
                      </span>
                    </div>
                  </li>
                ))}
                {ledger.length === 0 ? (
                  <li className="py-3 text-sm text-slate-500">Sem lançamentos ainda.</li>
                ) : null}
              </ul>
            </section>

            {/* Invoices */}
            <section className="kuteka-detail-panel p-5" aria-labelledby="inv">
              <h2 id="inv" className="kuteka-detail-title">
                {copy.sections.invoices}
              </h2>
              <ul className="mt-3 divide-y divide-slate-200">
                {invoices.map((inv) => (
                  <li key={inv.id} className="flex justify-between gap-3 py-2 text-sm">
                    <span className="font-mono">{inv.number}</span>
                    <span>
                      <Badge variant={inv.status === 'paid' ? 'success' : 'default'}>
                        {inv.status}
                      </Badge>{' '}
                      {formatAoaAmount(Number(inv.total), inv.currency)}
                    </span>
                  </li>
                ))}
                {invoices.length === 0 ? (
                  <li className="py-3 text-sm text-slate-500">Sem faturas.</li>
                ) : null}
              </ul>
            </section>
          </SoftListSlot>
        ) : null}
      </div>
    </SessionStatusGate>
  );
}
