'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FINANCE_URGENCY_BANDS } from '@kuteka/validation';
import { Badge, Button, Label } from '@kuteka/ui';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../../content';
import {
  captureSandboxPayment,
  createSandboxPayment,
  listFinanceProducts,
  listGateways,
  type FinanceGatewayRow,
  type FinanceProductRow,
} from '../../services/finance-client';
import { Feedback, PanelSection, selectClass, useFeedback, type PanelProps } from './shared';

export function GatewaysPanel({ canManage }: PanelProps) {
  const { locale } = useLocale();
  const copy = getFinanceCopy(locale);
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [gateways, setGateways] = useState<FinanceGatewayRow[]>([]);
  const [products, setProducts] = useState<FinanceProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sandboxProduct, setSandboxProduct] = useState('smart_move.open');
  const [sandboxUrgency, setSandboxUrgency] =
    useState<(typeof FINANCE_URGENCY_BANDS)[number]>('urgent_30');
  const [lastIntentId, setLastIntentId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [gws, prods] = await Promise.all([listGateways(), listFinanceProducts()]);
    if (gws.ok) setGateways(gws.data);
    if (prods.ok) setProducts(prods.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSandboxPay(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy('pay');
    setError(null);
    setMessage(null);
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

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />

      {canManage ? (
        <PanelSection title={copy.sections.sandbox} description={copy.sandboxHint}>
          <form className="grid gap-3 sm:grid-cols-3" onSubmit={onSandboxPay}>
            <div>
              <Label htmlFor="sandboxProduct">Produto</Label>
              <select
                id="sandboxProduct"
                className={selectClass}
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
                className={selectClass}
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
        </PanelSection>
      ) : null}

      <SoftListSlot pending={loading && gateways.length === 0}>
        <PanelSection title={copy.sections.gateways}>
          <ul className="grid gap-2 sm:grid-cols-2">
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
        </PanelSection>
      </SoftListSlot>
    </div>
  );
}
