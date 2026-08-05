'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import {
  createSandboxPayment,
  captureSandboxPayment,
  formatAoaAmount,
  listFinanceProducts,
  listInvoices,
  type FinanceInvoiceRow,
  type FinanceProductRow,
} from '@/modules/finance/services/finance-client';

/**
 * User-facing finance hub — pay-per-use sandbox + invoices.
 * Free exploration remains free; this is for optional paid services.
 */
export function FinanceHubClient() {
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const ready = sessionStatus === 'ready';
  const [products, setProducts] = useState<FinanceProductRow[]>([]);
  const [invoices, setInvoices] = useState<FinanceInvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [p, i] = await Promise.all([listFinanceProducts(), listInvoices(10)]);
    if (p.ok) setProducts(p.data.filter((x) => x.active && x.category !== 'commission'));
    if (i.ok) setInvoices(i.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (ready) void load();
  }, [load, ready]);

  async function buyPlus() {
    setBusy(true);
    setError(null);
    setMessage(null);
    const created = await createSandboxPayment({
      productCode: 'kuteka_plus.monthly',
      gatewayCode: 'sandbox',
      description: 'Kuteka Plus (sandbox)',
    });
    if (!created.ok) {
      setBusy(false);
      setError(created.message);
      return;
    }
    const captured = await captureSandboxPayment({
      paymentIntentId: String(created.data.paymentIntentId),
    });
    setBusy(false);
    if (!captured.ok) {
      setError(captured.message);
      return;
    }
    setMessage(`Plus activado (sandbox). Fatura ${String(captured.data.invoiceNumber)}`);
    await load();
  }

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
              <Link href="/app/perfil" className={cn(buttonVariants({ variant: 'secondary' }))}>
                Completar identidade
              </Link>
            </div>
          </section>

          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">As minhas faturas</h2>
            <ul className="mt-3 divide-y divide-slate-200">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex justify-between py-2 text-sm">
                  <span className="font-mono">{inv.number}</span>
                  <span>
                    {formatAoaAmount(Number(inv.total), inv.currency)} · {inv.status}
                  </span>
                </li>
              ))}
              {invoices.length === 0 ? (
                <li className="py-3 text-sm text-slate-500">Ainda sem faturas.</li>
              ) : null}
            </ul>
          </section>
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
