'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  FINANCE_URGENCY_BANDS,
  KUTEKA_PAY_ADAPTER_CODES,
  KUTEKA_PAY_MODULE_CODES,
  KUTEKA_PAY_WEBHOOK_EVENTS,
} from '@kuteka/validation';
import { Badge, Button, Label } from '@kuteka/ui';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../../content';
import { formatAoaAmount } from '../../lib/format';
import { listFinanceProducts, type FinanceProductRow } from '../../services/finance-client';
import {
  createIntent,
  fetchAdapterHealth,
  listIntents,
  setDefaultGateway,
  simulateWebhook,
  type KutekaPayAdapterHealth,
  type KutekaPayIntentRow,
} from '../../services/kuteka-pay-client';
import { Feedback, PanelSection, selectClass, useFeedback, type PanelProps } from './shared';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  succeeded: 'success',
  awaiting_payment: 'warning',
  processing: 'warning',
  created: 'warning',
  failed: 'danger',
  cancelled: 'default',
  expired: 'default',
};

export function PayEnginePanel({ canManage }: PanelProps) {
  const { locale } = useLocale();
  const copy = getFinanceCopy(locale);
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [adapters, setAdapters] = useState<KutekaPayAdapterHealth[]>([]);
  const [intents, setIntents] = useState<KutekaPayIntentRow[]>([]);
  const [products, setProducts] = useState<FinanceProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [product, setProduct] = useState('smart_move.open');
  const [moduleCode, setModuleCode] =
    useState<(typeof KUTEKA_PAY_MODULE_CODES)[number]>('smart_move');
  const [urgency, setUrgency] = useState<(typeof FINANCE_URGENCY_BANDS)[number]>('urgent_30');
  const [gateway, setGateway] = useState<(typeof KUTEKA_PAY_ADAPTER_CODES)[number]>('sandbox');

  const [webhookIntent, setWebhookIntent] = useState('');
  const [webhookEvent, setWebhookEvent] =
    useState<(typeof KUTEKA_PAY_WEBHOOK_EVENTS)[number]>('succeeded');
  const [defaultGateway, setDefaultGatewayCode] =
    useState<(typeof KUTEKA_PAY_ADAPTER_CODES)[number]>('sandbox');

  const load = useCallback(async () => {
    const [health, ints, prods] = await Promise.all([
      fetchAdapterHealth(),
      listIntents(40),
      listFinanceProducts(),
    ]);
    if (health.ok) {
      setAdapters(health.data);
      const current = health.data.find((a) => a.is_default);
      if (current) setDefaultGatewayCode(current.code as (typeof KUTEKA_PAY_ADAPTER_CODES)[number]);
    }
    if (ints.ok) {
      setIntents(ints.data);
      const first = ints.data[0];
      if (!webhookIntent && first) setWebhookIntent(first.id);
    }
    if (prods.ok) setProducts(prods.data);
    setLoading(false);
  }, [webhookIntent]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreateIntent(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy('create');
    setError(null);
    setMessage(null);
    const res = await createIntent({
      productCode: product,
      moduleCode,
      purpose: 'payengine_test',
      urgencyBand: urgency,
      gatewayCode: gateway,
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(
      `Intent criado (${res.data.gateway}${res.data.sandbox ? ' · sandbox' : ''}). Ação: ${res.data.clientAction.type}.`,
    );
    setWebhookIntent(res.data.paymentIntentId);
    await load();
  }

  async function onSimulateWebhook(e: FormEvent) {
    e.preventDefault();
    if (!canManage || !webhookIntent) return;
    setBusy('webhook');
    setError(null);
    setMessage(null);
    const res = await simulateWebhook({ paymentIntentId: webhookIntent, event: webhookEvent });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(`Webhook "${webhookEvent}" processado.`);
    await load();
  }

  async function onSetDefault(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy('default');
    setError(null);
    setMessage(null);
    const res = await setDefaultGateway({ gatewayCode: defaultGateway });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(`Gateway por omissão: ${defaultGateway}.`);
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />

      <PanelSection title={copy.sections.payEngine} description={copy.payEngineHint}>
        <SoftListSlot pending={loading && adapters.length === 0}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {adapters.map((a) => (
              <li key={a.code} className="rounded-kuteka border border-slate-200 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{a.name}</p>
                    <p className="font-mono text-xs text-slate-500">{a.code}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {a.is_default ? <Badge variant="success">Default</Badge> : null}
                    {a.sandbox ? <Badge variant="warning">Sandbox</Badge> : null}
                    <Badge variant={a.active ? 'success' : 'default'}>
                      {a.active ? 'On' : 'Off'}
                    </Badge>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  {a.intents} intents · {a.succeeded} ok · {a.failed} falhas · {a.pending} pendentes
                  · prio {a.priority}
                </p>
              </li>
            ))}
          </ul>
        </SoftListSlot>
      </PanelSection>

      {canManage ? (
        <PanelSection
          title={copy.sections.payEngineDefault}
          description={copy.payEngineDefaultHint}
        >
          <form className="flex flex-wrap items-end gap-3" onSubmit={onSetDefault}>
            <div>
              <Label htmlFor="pe-default">Adaptador base</Label>
              <select
                id="pe-default"
                className={selectClass}
                value={defaultGateway}
                onChange={(e) =>
                  setDefaultGatewayCode(e.target.value as (typeof KUTEKA_PAY_ADAPTER_CODES)[number])
                }
              >
                {KUTEKA_PAY_ADAPTER_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" loading={busy === 'default'}>
              {copy.setDefaultGateway}
            </Button>
          </form>
        </PanelSection>
      ) : null}

      {canManage ? (
        <PanelSection title={copy.sections.payEngineIntent} description={copy.payEngineIntentHint}>
          <form className="grid gap-3 sm:grid-cols-4" onSubmit={onCreateIntent}>
            <div>
              <Label htmlFor="pe-product">Produto</Label>
              <select
                id="pe-product"
                className={selectClass}
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.code}>
                    {p.code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="pe-module">Módulo</Label>
              <select
                id="pe-module"
                className={selectClass}
                value={moduleCode}
                onChange={(e) =>
                  setModuleCode(e.target.value as (typeof KUTEKA_PAY_MODULE_CODES)[number])
                }
              >
                {KUTEKA_PAY_MODULE_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="pe-urgency">Urgência</Label>
              <select
                id="pe-urgency"
                className={selectClass}
                value={urgency}
                onChange={(e) =>
                  setUrgency(e.target.value as (typeof FINANCE_URGENCY_BANDS)[number])
                }
              >
                {FINANCE_URGENCY_BANDS.map((band) => (
                  <option key={band} value={band}>
                    {band}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="pe-gateway">Adaptador</Label>
              <select
                id="pe-gateway"
                className={selectClass}
                value={gateway}
                onChange={(e) =>
                  setGateway(e.target.value as (typeof KUTEKA_PAY_ADAPTER_CODES)[number])
                }
              >
                {KUTEKA_PAY_ADAPTER_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-4">
              <Button type="submit" loading={busy === 'create'}>
                {copy.createIntent}
              </Button>
            </div>
          </form>
        </PanelSection>
      ) : null}

      {canManage ? (
        <PanelSection
          title={copy.sections.payEngineWebhook}
          description={copy.payEngineWebhookHint}
        >
          <form className="grid gap-3 sm:grid-cols-3" onSubmit={onSimulateWebhook}>
            <div className="sm:col-span-2">
              <Label htmlFor="pe-webhook-intent">Intent</Label>
              <select
                id="pe-webhook-intent"
                className={selectClass}
                value={webhookIntent}
                onChange={(e) => setWebhookIntent(e.target.value)}
              >
                {intents.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.module_code} · {formatAoaAmount(Number(i.amount), i.currency)} · {i.status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="pe-webhook-event">Evento</Label>
              <select
                id="pe-webhook-event"
                className={selectClass}
                value={webhookEvent}
                onChange={(e) =>
                  setWebhookEvent(e.target.value as (typeof KUTEKA_PAY_WEBHOOK_EVENTS)[number])
                }
              >
                {KUTEKA_PAY_WEBHOOK_EVENTS.map((ev) => (
                  <option key={ev} value={ev}>
                    {ev}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" loading={busy === 'webhook'} disabled={!webhookIntent}>
                {copy.simulateWebhook}
              </Button>
            </div>
          </form>
        </PanelSection>
      ) : null}

      <SoftListSlot pending={loading && intents.length === 0}>
        <PanelSection title={copy.sections.payEngineIntents}>
          <ul className="divide-y divide-slate-200">
            {intents.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {i.module_code}
                    {i.purpose ? <span className="text-slate-500"> · {i.purpose}</span> : null}
                  </p>
                  <p className="font-mono text-xs text-slate-500">
                    {i.adapter_code} · {formatAoaAmount(Number(i.amount), i.currency)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {i.sandbox ? <Badge variant="warning">Sandbox</Badge> : null}
                  <Badge variant={STATUS_VARIANT[i.status] ?? 'default'}>{i.status}</Badge>
                </div>
              </li>
            ))}
            {intents.length === 0 ? (
              <li className="py-3 text-sm text-slate-500">Sem payment intents.</li>
            ) : null}
          </ul>
        </PanelSection>
      </SoftListSlot>
    </div>
  );
}
