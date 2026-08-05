'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Heading, Label, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { formatAoaAmount } from '@/modules/finance/lib/format';
import {
  PROVIDER_CATEGORIES,
  orderStatusLabel,
  orderStatusTone,
} from '@/modules/monetization/lib/catalog';
import {
  listServiceProviders,
  type ServiceProviderRow,
} from '@/modules/monetization/services/monetization-client';
import {
  acceptQuote,
  cancelOrder,
  completeOrder,
  createOrder,
  fetchMarketplaceContext,
  listMyOrders,
  listProviderInbox,
  payOrder,
  providerName,
  rateOrder,
  startOrder,
  submitQuote,
  type MarketplaceContext,
  type ServiceOrderDetail,
} from '@/modules/monetization/services/marketplace-client';

type TabKey = 'providers' | 'orders' | 'inbox';

function slaLabel(order: ServiceOrderDetail): string | null {
  if (!order.sla_due_at) return null;
  if (order.sla_breached) return 'SLA ultrapassado';
  const due = new Date(order.sla_due_at).getTime();
  const hours = Math.round((due - Date.now()) / 3_600_000);
  if (hours <= 0) return 'SLA no limite';
  return `SLA em ${hours}h`;
}

/**
 * Marketplace operacional (Fase C) — fecha o ciclo completo do prestador
 * reutilizando a mesma infraestrutura financeira (Ledger + Kuteka Pay).
 * O pagamento passa sempre pelo motor unificado Kuteka Pay.
 */
export function MarketplaceClient() {
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const ready = sessionStatus === 'ready';

  const [tab, setTab] = useState<TabKey>('providers');
  const [ctx, setCtx] = useState<MarketplaceContext | null>(null);
  const [category, setCategory] = useState('all');
  const [providers, setProviders] = useState<ServiceProviderRow[]>([]);
  const [orders, setOrders] = useState<ServiceOrderDetail[]>([]);
  const [inbox, setInbox] = useState<ServiceOrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [title, setTitle] = useState('Pedido de serviço');
  const [slaHours, setSlaHours] = useState('48');
  const [quoteAmounts, setQuoteAmounts] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<Record<string, string>>({});

  const providerIds = useMemo(() => (ctx?.providers ?? []).map((p) => p.id), [ctx]);
  const showInbox = Boolean(ctx && (ctx.isProvider || ctx.canManage) && providerIds.length > 0);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, p, o] = await Promise.all([
      fetchMarketplaceContext(),
      listServiceProviders(category),
      listMyOrders(),
    ]);
    if (c.ok) setCtx(c.data);
    if (p.ok) setProviders(p.data);
    else setError(p.message);
    if (o.ok) setOrders(o.data);
    const ids = c.ok ? c.data.providers.map((x) => x.id) : [];
    if (ids.length > 0) {
      const inb = await listProviderInbox(ids);
      if (inb.ok) setInbox(inb.data);
    } else {
      setInbox([]);
    }
    setLoading(false);
  }, [category]);

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

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">Marketplace operacional</p>
          <Heading level={1}>Rede de serviços Kuteka</Heading>
          <Text className="mt-1 text-slate-700">
            Prestador → orçamento → aceitação → execução → pagamento (Kuteka Pay) → avaliação. A
            comissão fica no Ledger (take-rate B2B — sem escrow).
          </Text>
          {session?.email ? <p className="kuteka-detail-meta mt-2">{session.email}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/app/mudanca" className={cn(buttonVariants({ variant: 'secondary' }))}>
              Mudança Inteligente
            </Link>
            <Link href="/app/financeiro" className={cn(buttonVariants({ variant: 'ghost' }))}>
              Financeiro
            </Link>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2">
          <TabButton active={tab === 'providers'} onClick={() => setTab('providers')}>
            Prestadores
          </TabButton>
          <TabButton active={tab === 'orders'} onClick={() => setTab('orders')}>
            Os meus pedidos
          </TabButton>
          {showInbox ? (
            <TabButton active={tab === 'inbox'} onClick={() => setTab('inbox')}>
              Pedidos recebidos
              {inbox.length > 0 ? (
                <span className="ml-2 rounded-full bg-white/70 px-1.5 text-xs">{inbox.length}</span>
              ) : null}
            </TabButton>
          ) : null}
        </nav>

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
          {tab === 'providers' ? (
            <ProvidersPanel
              providers={providers}
              category={category}
              setCategory={setCategory}
              title={title}
              setTitle={setTitle}
              slaHours={slaHours}
              setSlaHours={setSlaHours}
              busyId={busyId}
              onRequest={(provider) =>
                run(
                  provider.id,
                  () =>
                    createOrder({
                      providerId: provider.id,
                      title: title.trim() || `Serviço ${provider.business_name}`,
                      category: provider.category,
                      description: `Pedido via marketplace Kuteka · ${provider.business_name}`,
                      slaHours: Number(slaHours) || 48,
                    }),
                  'Pedido criado. Aguarda orçamento do prestador.',
                )
              }
            />
          ) : null}

          {tab === 'orders' ? (
            <ClientOrdersPanel
              orders={orders}
              busyId={busyId}
              ratings={ratings}
              setRatings={setRatings}
              onAccept={(o) => run(o.id, () => acceptQuote({ orderId: o.id }), 'Orçamento aceite.')}
              onPay={(o) =>
                run(
                  o.id,
                  () => payOrder({ orderId: o.id, gatewayCode: 'sandbox' }),
                  'Pagamento processado via Kuteka Pay. Comissão registada no Ledger.',
                )
              }
              onRate={(o) => {
                const score = Number(ratings[o.id] ?? '5');
                return run(
                  o.id,
                  () => rateOrder({ orderId: o.id, score }),
                  'Avaliação registada. Obrigado!',
                );
              }}
              onCancel={(o) => run(o.id, () => cancelOrder({ orderId: o.id }), 'Pedido cancelado.')}
            />
          ) : null}

          {tab === 'inbox' ? (
            <ProviderInboxPanel
              orders={inbox}
              busyId={busyId}
              quoteAmounts={quoteAmounts}
              setQuoteAmounts={setQuoteAmounts}
              onQuote={(o) => {
                const amount = Number(quoteAmounts[o.id] ?? o.amount_aoa ?? 25000);
                return run(
                  o.id,
                  () => submitQuote({ orderId: o.id, amount }),
                  'Orçamento enviado ao cliente.',
                );
              }}
              onStart={(o) => run(o.id, () => startOrder({ orderId: o.id }), 'Execução iniciada.')}
              onComplete={(o) =>
                run(o.id, () => completeOrder({ orderId: o.id }), 'Serviço concluído.')
              }
              onCancel={(o) => run(o.id, () => cancelOrder({ orderId: o.id }), 'Pedido cancelado.')}
            />
          ) : null}
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-kuteka border px-4 py-2 text-sm font-medium transition',
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400',
      )}
    >
      {children}
    </button>
  );
}

function OrderMeta({ order }: { order: ServiceOrderDetail }) {
  const amount = order.quoted_amount_aoa ?? order.amount_aoa;
  const sla = slaLabel(order);
  return (
    <p className="mt-1 text-xs text-slate-500">
      {amount != null ? `${formatAoaAmount(Number(amount))}` : 'Sem orçamento'}
      {order.commission_aoa != null
        ? ` · comissão ${formatAoaAmount(Number(order.commission_aoa))}`
        : ''}
      {order.payment_intent_id ? ' · pago' : ''}
      {order.rating_score != null ? ` · ★ ${Number(order.rating_score).toFixed(1)}` : ''}
      {sla ? ` · ${sla}` : ''}
    </p>
  );
}

function ProvidersPanel({
  providers,
  category,
  setCategory,
  title,
  setTitle,
  slaHours,
  setSlaHours,
  busyId,
  onRequest,
}: {
  providers: ServiceProviderRow[];
  category: string;
  setCategory: (v: string) => void;
  title: string;
  setTitle: (v: string) => void;
  slaHours: string;
  setSlaHours: (v: string) => void;
  busyId: string | null;
  onRequest: (provider: ServiceProviderRow) => void;
}) {
  return (
    <section className="kuteka-detail-panel p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="kuteka-detail-title">Prestadores activos</h2>
          <p className="kuteka-detail-body mt-1">Filtre por categoria e peça um serviço.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div>
            <Label htmlFor="cat">Categoria</Label>
            <select
              id="cat"
              className="w-full min-w-[10rem] rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {PROVIDER_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="sla">SLA (horas)</Label>
            <input
              id="sla"
              inputMode="numeric"
              className="w-full min-w-[7rem] rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
              value={slaHours}
              onChange={(e) => setSlaHours(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="mt-3">
        <Label htmlFor="title">Título do pedido</Label>
        <input
          id="title"
          className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <ul className="mt-4 divide-y divide-slate-200">
        {providers.map((p) => (
          <li
            key={p.id}
            className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-slate-900">{p.business_name}</p>
              <p className="text-sm text-slate-600">{p.description}</p>
              <p className="mt-1 text-xs text-slate-500">
                {p.category}
                {p.municipality ? ` · ${p.municipality}` : ''}
                {p.province ? `, ${p.province}` : ''}
                {p.rating != null ? ` · ★ ${Number(p.rating).toFixed(1)}` : ''}
                {p.is_demo ? ' · demo' : ''}
              </p>
            </div>
            <Button type="button" size="sm" loading={busyId === p.id} onClick={() => onRequest(p)}>
              Pedir serviço
            </Button>
          </li>
        ))}
        {providers.length === 0 ? (
          <li className="py-3 text-sm text-slate-500">Sem prestadores nesta categoria.</li>
        ) : null}
      </ul>
    </section>
  );
}

function ClientOrdersPanel({
  orders,
  busyId,
  ratings,
  setRatings,
  onAccept,
  onPay,
  onRate,
  onCancel,
}: {
  orders: ServiceOrderDetail[];
  busyId: string | null;
  ratings: Record<string, string>;
  setRatings: (v: Record<string, string>) => void;
  onAccept: (o: ServiceOrderDetail) => void;
  onPay: (o: ServiceOrderDetail) => void;
  onRate: (o: ServiceOrderDetail) => void;
  onCancel: (o: ServiceOrderDetail) => void;
}) {
  return (
    <section className="kuteka-detail-panel p-5">
      <h2 className="kuteka-detail-title">Os meus pedidos</h2>
      <ul className="mt-3 divide-y divide-slate-200">
        {orders.map((o) => {
          const busy = busyId === o.id;
          const paid = Boolean(o.payment_intent_id);
          const rated = Boolean(o.rated_at);
          return (
            <li key={o.id} className="flex flex-col gap-2 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {o.title} · {providerName(o)}
                  </p>
                  <OrderMeta order={o} />
                  {o.quote_notes ? (
                    <p className="mt-1 text-xs text-slate-500">Nota: {o.quote_notes}</p>
                  ) : null}
                </div>
                <Badge variant={orderStatusTone(o.status)}>{orderStatusLabel(o.status)}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {o.status === 'quoted' ? (
                  <Button type="button" size="sm" loading={busy} onClick={() => onAccept(o)}>
                    Aceitar orçamento
                  </Button>
                ) : null}
                {o.status === 'completed' && !paid ? (
                  <Button type="button" size="sm" loading={busy} onClick={() => onPay(o)}>
                    Pagar com Kuteka Pay
                  </Button>
                ) : null}
                {o.status === 'completed' && paid && !rated ? (
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Avaliação"
                      className="rounded-kuteka border border-slate-300 bg-white px-2 py-1 text-sm"
                      value={ratings[o.id] ?? '5'}
                      onChange={(e) => setRatings({ ...ratings, [o.id]: e.target.value })}
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={String(n)}>
                          {'★'.repeat(n)}
                        </option>
                      ))}
                    </select>
                    <Button type="button" size="sm" loading={busy} onClick={() => onRate(o)}>
                      Avaliar
                    </Button>
                  </div>
                ) : null}
                {['requested', 'quoted', 'accepted', 'in_progress'].includes(o.status) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    loading={busy}
                    onClick={() => onCancel(o)}
                  >
                    Cancelar
                  </Button>
                ) : null}
                {rated ? (
                  <span className="text-xs text-emerald-700">
                    Avaliado ★ {Number(o.rating_score).toFixed(1)}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
        {orders.length === 0 ? (
          <li className="py-3 text-sm text-slate-500">Ainda sem pedidos.</li>
        ) : null}
      </ul>
    </section>
  );
}

function ProviderInboxPanel({
  orders,
  busyId,
  quoteAmounts,
  setQuoteAmounts,
  onQuote,
  onStart,
  onComplete,
  onCancel,
}: {
  orders: ServiceOrderDetail[];
  busyId: string | null;
  quoteAmounts: Record<string, string>;
  setQuoteAmounts: (v: Record<string, string>) => void;
  onQuote: (o: ServiceOrderDetail) => void;
  onStart: (o: ServiceOrderDetail) => void;
  onComplete: (o: ServiceOrderDetail) => void;
  onCancel: (o: ServiceOrderDetail) => void;
}) {
  return (
    <section className="kuteka-detail-panel p-5">
      <h2 className="kuteka-detail-title">Pedidos recebidos</h2>
      <p className="kuteka-detail-body mt-1">
        Envie orçamentos, inicie e conclua serviços. Demos podem ser operados por finance.manage.
      </p>
      <ul className="mt-3 divide-y divide-slate-200">
        {orders.map((o) => {
          const busy = busyId === o.id;
          return (
            <li key={o.id} className="flex flex-col gap-2 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {o.title} · {providerName(o)}
                  </p>
                  <OrderMeta order={o} />
                </div>
                <Badge variant={orderStatusTone(o.status)}>{orderStatusLabel(o.status)}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {o.status === 'requested' || o.status === 'quoted' ? (
                  <div className="flex items-center gap-2">
                    <input
                      aria-label="Valor do orçamento (AOA)"
                      inputMode="numeric"
                      placeholder="Valor AOA"
                      className="w-32 rounded-kuteka border border-slate-300 bg-white px-2 py-1 text-sm"
                      value={quoteAmounts[o.id] ?? String(o.amount_aoa ?? '')}
                      onChange={(e) => setQuoteAmounts({ ...quoteAmounts, [o.id]: e.target.value })}
                    />
                    <Button type="button" size="sm" loading={busy} onClick={() => onQuote(o)}>
                      {o.status === 'quoted' ? 'Reorçamentar' : 'Enviar orçamento'}
                    </Button>
                  </div>
                ) : null}
                {o.status === 'accepted' ? (
                  <Button type="button" size="sm" loading={busy} onClick={() => onStart(o)}>
                    Iniciar execução
                  </Button>
                ) : null}
                {o.status === 'in_progress' ? (
                  <Button type="button" size="sm" loading={busy} onClick={() => onComplete(o)}>
                    Concluir serviço
                  </Button>
                ) : null}
                {['requested', 'quoted', 'accepted', 'in_progress'].includes(o.status) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    loading={busy}
                    onClick={() => onCancel(o)}
                  >
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
        {orders.length === 0 ? (
          <li className="py-3 text-sm text-slate-500">Sem pedidos recebidos.</li>
        ) : null}
      </ul>
    </section>
  );
}
