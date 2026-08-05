'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Heading, Input, Label, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import {
  fetchMyCreditBalance,
  formatAoaAmount,
  generateInvoicePdf,
  listFinanceProducts,
  listInvoices,
  listMyConsents,
  listRefunds,
  redeemCredits,
  upsertConsent,
  CONSENT_SCOPES,
  type CreditBalance,
  type FinanceConsentRow,
  type FinanceConsentScope,
  type FinanceInvoiceRow,
  type FinanceProductRow,
  type FinanceRefundRow,
} from '@/modules/finance/services/finance-client';
import { createAndSettle } from '@/modules/finance/services/kuteka-pay-client';
import {
  listPaymentReminders,
  type PaymentReminderRow,
} from '@/modules/monetization/services/monetization-client';
import { getFinanceHubCopy } from '../content/pt';

/**
 * User-facing finance hub — pay-per-use sandbox + invoices.
 * Free exploration remains free; this is for optional paid services.
 */
function openHtml(html: string) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function FinanceHubClient() {
  const hubCopy = getFinanceHubCopy();
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const ready = sessionStatus === 'ready';
  const [products, setProducts] = useState<FinanceProductRow[]>([]);
  const [invoices, setInvoices] = useState<FinanceInvoiceRow[]>([]);
  const [reminders, setReminders] = useState<PaymentReminderRow[]>([]);
  const [consents, setConsents] = useState<FinanceConsentRow[]>([]);
  const [refunds, setRefunds] = useState<FinanceRefundRow[]>([]);
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [invoiceBusy, setInvoiceBusy] = useState<string | null>(null);
  const [consentBusy, setConsentBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, i, rem, cons, refs, bal] = await Promise.all([
      listFinanceProducts(),
      listInvoices(10),
      listPaymentReminders(12),
      listMyConsents(),
      listRefunds(10),
      fetchMyCreditBalance(),
    ]);
    if (p.ok) setProducts(p.data.filter((x) => x.active && x.category !== 'commission'));
    if (i.ok) setInvoices(i.data);
    if (rem.ok) setReminders(rem.data);
    if (cons.ok) setConsents(cons.data);
    if (refs.ok) setRefunds(refs.data);
    if (bal.ok) setBalance(bal.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (ready) void load();
  }, [load, ready]);

  async function buyPlus() {
    setBusy(true);
    setError(null);
    setMessage(null);
    // Motor unificado Kuteka Pay: cria o intent (módulo plus) e, em sandbox,
    // captura-o de imediato. Trocar de gateway não exige mudar este código.
    const settled = await createAndSettle({
      productCode: 'kuteka_plus.monthly',
      moduleCode: 'plus',
      purpose: 'plus_subscription',
      gatewayCode: 'sandbox',
      description: 'Kuteka Plus (sandbox)',
    });
    setBusy(false);
    if (!settled.ok) {
      setError(settled.message);
      return;
    }
    setMessage(
      settled.captured
        ? `Plus activado (sandbox). Fatura ${settled.invoiceNumber ?? '—'}`
        : 'Plus a aguardar pagamento no gateway.',
    );
    await load();
  }

  async function onRedeem() {
    const amount = Number(redeemAmount);
    if (!amount || amount <= 0) return;
    setRedeemBusy(true);
    setError(null);
    setMessage(null);
    const res = await redeemCredits({ amount, reason: 'Uso de créditos no hub' });
    setRedeemBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(hubCopy.redeemDone);
    setRedeemAmount('');
    await load();
  }

  async function onDownloadInvoice(id: string) {
    setInvoiceBusy(id);
    setError(null);
    const res = await generateInvoicePdf({ invoiceId: id });
    setInvoiceBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    openHtml(res.data.html);
  }

  async function toggleConsent(scope: FinanceConsentScope, granted: boolean) {
    setConsentBusy(scope);
    setError(null);
    const result = await upsertConsent(scope, granted);
    setConsentBusy(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(granted ? `Consentimento ${scope} concedido.` : `Consentimento ${scope} revogado.`);
    await load();
  }

  const consentMap = new Map(consents.map((c) => [c.scope, c.granted]));

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">Financeiro</p>
          <Heading level={1}>Pagamentos e serviços Kuteka</Heading>
          <Text className="mt-1 text-slate-700">
            Explorar casas continua gratuito. Aqui activa serviços opcionais (pay-per-use / Plus)
            via Kuteka Pay (sandbox até Multicaixa/EMIS).
          </Text>
          {session?.email ? <p className="kuteka-detail-meta mt-2">{session.email}</p> : null}
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
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="kuteka-detail-eyebrow">{hubCopy.creditBalance}</p>
                <p className="text-2xl font-semibold tabular-nums text-slate-900">
                  {formatAoaAmount(balance?.balance ?? 0, balance?.currency ?? 'AOA')}
                </p>
              </div>
              <div className="flex items-end gap-2">
                <div>
                  <Label htmlFor="redeem-amount">{hubCopy.redeem} (Kz)</Label>
                  <Input
                    id="redeem-amount"
                    className="w-32"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
                <Button
                  type="button"
                  loading={redeemBusy}
                  disabled={!redeemAmount || Number(redeemAmount) <= 0}
                  onClick={() => void onRedeem()}
                >
                  {hubCopy.redeem}
                </Button>
              </div>
            </div>
            <p className="kuteka-detail-meta mt-2">{hubCopy.redeemHint}</p>
          </section>

          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">Serviços disponíveis</h2>
            <ul className="mt-3 divide-y divide-slate-200">
              {products.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <p className="text-sm text-slate-600">{p.description}</p>
                  </div>
                  <Badge variant="default">{p.category}</Badge>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" loading={busy} onClick={() => void buyPlus()}>
                Activar Kuteka Plus (sandbox)
              </Button>
              <Link href="/app/mudanca" className={cn(buttonVariants({ variant: 'secondary' }))}>
                Mudança Inteligente
              </Link>
              <Link href="/app/servicos" className={cn(buttonVariants({ variant: 'secondary' }))}>
                Prestadores
              </Link>
              <Link
                href="/app/parceiro/planos"
                className={cn(buttonVariants({ variant: 'ghost' }))}
              >
                Planos Parceiro
              </Link>
              <Link href="/app/perfil" className={cn(buttonVariants({ variant: 'ghost' }))}>
                Completar identidade
              </Link>
            </div>
          </section>

          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">Consentimentos comerciais</h2>
            <p className="kuteka-detail-body mt-1">
              Controla ofertas KAI, parceiros e prestadores (opt-in).
            </p>
            <ul className="mt-3 divide-y divide-slate-200">
              {CONSENT_SCOPES.map((item) => {
                const granted = consentMap.get(item.scope) === true;
                return (
                  <li
                    key={item.scope}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                  >
                    <span className="text-sm text-slate-800">{item.label}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant={granted ? 'secondary' : 'primary'}
                      loading={consentBusy === item.scope}
                      onClick={() => void toggleConsent(item.scope, !granted)}
                    >
                      {granted ? 'Revogar' : 'Autorizar'}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">Lembretes de renda</h2>
            <ul className="mt-3 divide-y divide-slate-200">
              {reminders.map((r) => (
                <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                  <span>
                    {r.offset_label.toUpperCase()} · {r.scheduled_for} · {r.channel}
                  </span>
                  <Badge variant={r.status === 'scheduled' ? 'warning' : 'success'}>
                    {r.status}
                  </Badge>
                </li>
              ))}
              {reminders.length === 0 ? (
                <li className="py-3 text-sm text-slate-500">Sem lembretes agendados.</li>
              ) : null}
            </ul>
          </section>

          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">As minhas faturas</h2>
            <ul className="mt-3 divide-y divide-slate-200">
              {invoices.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                >
                  <span className="font-mono">{inv.number}</span>
                  <span className="flex items-center gap-2">
                    {formatAoaAmount(Number(inv.total), inv.currency)} · {inv.status}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      loading={invoiceBusy === inv.id}
                      onClick={() => void onDownloadInvoice(inv.id)}
                    >
                      {hubCopy.downloadInvoice}
                    </Button>
                  </span>
                </li>
              ))}
              {invoices.length === 0 ? (
                <li className="py-3 text-sm text-slate-500">Ainda sem faturas.</li>
              ) : null}
            </ul>
          </section>

          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">{hubCopy.myRefunds}</h2>
            <ul className="mt-3 divide-y divide-slate-200">
              {refunds.map((r) => (
                <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                  <span>
                    {r.reason} <span className="text-slate-500">({r.mode})</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant={r.status === 'completed' ? 'success' : 'default'}>
                      {r.status}
                    </Badge>
                    {formatAoaAmount(Number(r.amount), r.currency)}
                  </span>
                </li>
              ))}
              {refunds.length === 0 ? (
                <li className="py-3 text-sm text-slate-500">{hubCopy.noRefunds}</li>
              ) : null}
            </ul>
          </section>
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
