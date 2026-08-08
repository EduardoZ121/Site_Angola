'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Heading, Label, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import type { AppLocale } from '@/modules/i18n/types';
import { publicModuleBadge } from '@/modules/kocc/lib/public-label';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { formatAoaAmount } from '@/modules/finance/lib/format';
import { getMonetizationCopy, type MonetizationCopy } from '@/modules/monetization/content';
import {
  PROVIDER_CATEGORIES,
  orderStatusLabel,
  orderStatusTone,
  providerCategoryLabel,
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

function slaLabel(order: ServiceOrderDetail, common: MonetizationCopy['common']): string | null {
  if (!order.sla_due_at) return null;
  if (order.sla_breached) return common.slaBreached;
  const due = new Date(order.sla_due_at).getTime();
  const hours = Math.round((due - Date.now()) / 3_600_000);
  if (hours <= 0) return common.slaAtLimit;
  return common.slaInHours.replace('{hours}', String(hours));
}

/**
 * Marketplace operacional (Fase C) — fecha o ciclo completo do prestador
 * reutilizando a mesma infraestrutura financeira (Ledger + Kuteka Pay).
 * O pagamento passa sempre pelo motor unificado Kuteka Pay.
 */
export function MarketplaceClient() {
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const { locale } = useLocale();
  const copy = getMonetizationCopy(locale).marketplace;
  const common = getMonetizationCopy(locale).common;
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

  const [title, setTitle] = useState('');
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
          <p className="kuteka-detail-eyebrow">{copy.eyebrow}</p>
          <Heading level={1}>{copy.title}</Heading>
          <Text className="mt-1 text-slate-700">{copy.subtitle}</Text>
          {session?.email ? <p className="kuteka-detail-meta mt-2">{session.email}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/app/mudanca" className={cn(buttonVariants({ variant: 'secondary' }))}>
              {copy.smartMoveLink}
            </Link>
            <Link href="/app/financeiro" className={cn(buttonVariants({ variant: 'ghost' }))}>
              {common.financeiro}
            </Link>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2">
          <TabButton active={tab === 'providers'} onClick={() => setTab('providers')}>
            {copy.tabs.providers}
          </TabButton>
          <TabButton active={tab === 'orders'} onClick={() => setTab('orders')}>
            {copy.tabs.myOrders}
          </TabButton>
          {showInbox ? (
            <TabButton active={tab === 'inbox'} onClick={() => setTab('inbox')}>
              {copy.tabs.inbox}
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
              locale={locale}
              copy={copy}
              onRequest={(provider) =>
                run(
                  provider.id,
                  () =>
                    createOrder({
                      providerId: provider.id,
                      title:
                        title.trim() ||
                        copy.providersPanel.titleDefault ||
                        `Serviço ${provider.business_name}`,
                      category: provider.category,
                      description: copy.providersPanel.serviceOfProvider.replace(
                        '{name}',
                        provider.business_name,
                      ),
                      slaHours: Number(slaHours) || 48,
                    }),
                  copy.messages.requestCreated,
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
              locale={locale}
              copy={copy}
              common={common}
              onAccept={(o) =>
                run(o.id, () => acceptQuote({ orderId: o.id }), copy.messages.quoteAccepted)
              }
              onPay={(o) =>
                run(
                  o.id,
                  () => payOrder({ orderId: o.id, gatewayCode: 'sandbox' }),
                  copy.messages.paid,
                )
              }
              onRate={(o) => {
                const score = Number(ratings[o.id] ?? '5');
                return run(o.id, () => rateOrder({ orderId: o.id, score }), copy.messages.rated);
              }}
              onCancel={(o) =>
                run(o.id, () => cancelOrder({ orderId: o.id }), copy.messages.cancelled)
              }
            />
          ) : null}

          {tab === 'inbox' ? (
            <ProviderInboxPanel
              orders={inbox}
              busyId={busyId}
              quoteAmounts={quoteAmounts}
              setQuoteAmounts={setQuoteAmounts}
              locale={locale}
              copy={copy}
              common={common}
              onQuote={(o) => {
                const amount = Number(quoteAmounts[o.id] ?? o.amount_aoa ?? 25000);
                return run(
                  o.id,
                  () => submitQuote({ orderId: o.id, amount }),
                  copy.messages.quoteSent,
                );
              }}
              onStart={(o) => run(o.id, () => startOrder({ orderId: o.id }), copy.messages.started)}
              onComplete={(o) =>
                run(o.id, () => completeOrder({ orderId: o.id }), copy.messages.completed)
              }
              onCancel={(o) =>
                run(o.id, () => cancelOrder({ orderId: o.id }), copy.messages.cancelled)
              }
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

function OrderMeta({
  order,
  copy,
  common,
}: {
  order: ServiceOrderDetail;
  copy: MonetizationCopy['marketplace'];
  common: MonetizationCopy['common'];
}) {
  const amount = order.quoted_amount_aoa ?? order.amount_aoa;
  const sla = slaLabel(order, common);
  return (
    <p className="mt-1 text-xs text-slate-500">
      {amount != null ? `${formatAoaAmount(Number(amount))}` : copy.orderMeta.noQuote}
      {order.commission_aoa != null
        ? copy.orderMeta.commissionSuffix.replace(
            '{amount}',
            formatAoaAmount(Number(order.commission_aoa)),
          )
        : ''}
      {order.payment_intent_id ? copy.orderMeta.paidSuffix : ''}
      {order.rating_score != null
        ? copy.orderMeta.ratingSuffix.replace('{score}', Number(order.rating_score).toFixed(1))
        : ''}
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
  locale,
  copy,
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
  locale: AppLocale;
  copy: MonetizationCopy['marketplace'];
  onRequest: (provider: ServiceProviderRow) => void;
}) {
  const p = copy.providersPanel;
  return (
    <section className="kuteka-detail-panel p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="kuteka-detail-title">{p.title}</h2>
          <p className="kuteka-detail-body mt-1">{p.hint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div>
            <Label htmlFor="cat">{p.categoryLabel}</Label>
            <select
              id="cat"
              className="w-full min-w-[10rem] rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {PROVIDER_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {providerCategoryLabel(c.value, locale)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="sla">{p.slaLabel}</Label>
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
        <Label htmlFor="title">{p.titleLabel}</Label>
        <input
          id="title"
          className="w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={p.titleDefault}
        />
      </div>
      <ul className="mt-4 divide-y divide-slate-200">
        {providers.map((prov) => (
          <li
            key={prov.id}
            className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-slate-900">{prov.business_name}</p>
              <p className="text-sm text-slate-600">{prov.description}</p>
              <p className="mt-1 text-xs text-slate-500">
                {providerCategoryLabel(prov.category, locale)}
                {prov.municipality ? ` · ${prov.municipality}` : ''}
                {prov.province ? `, ${prov.province}` : ''}
                {prov.rating != null ? ` · ★ ${Number(prov.rating).toFixed(1)}` : ''}
                {prov.is_demo ? ` · ${publicModuleBadge('beta_public', locale)}` : ''}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              loading={busyId === prov.id}
              onClick={() => onRequest(prov)}
            >
              {p.requestService}
            </Button>
          </li>
        ))}
        {providers.length === 0 ? <li className="py-3 text-sm text-slate-500">{p.empty}</li> : null}
      </ul>
    </section>
  );
}

function ClientOrdersPanel({
  orders,
  busyId,
  ratings,
  setRatings,
  locale,
  copy,
  common,
  onAccept,
  onPay,
  onRate,
  onCancel,
}: {
  orders: ServiceOrderDetail[];
  busyId: string | null;
  ratings: Record<string, string>;
  setRatings: (v: Record<string, string>) => void;
  locale: AppLocale;
  copy: MonetizationCopy['marketplace'];
  common: MonetizationCopy['common'];
  onAccept: (o: ServiceOrderDetail) => void;
  onPay: (o: ServiceOrderDetail) => void;
  onRate: (o: ServiceOrderDetail) => void;
  onCancel: (o: ServiceOrderDetail) => void;
}) {
  const m = copy.myOrdersPanel;
  return (
    <section className="kuteka-detail-panel p-5">
      <h2 className="kuteka-detail-title">{m.title}</h2>
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
                  <OrderMeta order={o} copy={copy} common={common} />
                  {o.quote_notes ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {m.notePrefix.replace('{value}', o.quote_notes)}
                    </p>
                  ) : null}
                </div>
                <Badge variant={orderStatusTone(o.status)}>
                  {orderStatusLabel(o.status, locale)}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {o.status === 'quoted' ? (
                  <Button type="button" size="sm" loading={busy} onClick={() => onAccept(o)}>
                    {m.acceptQuote}
                  </Button>
                ) : null}
                {o.status === 'completed' && !paid ? (
                  <Button type="button" size="sm" loading={busy} onClick={() => onPay(o)}>
                    {m.payWithKutekaPay}
                  </Button>
                ) : null}
                {o.status === 'completed' && paid && !rated ? (
                  <div className="flex items-center gap-2">
                    <select
                      aria-label={m.ratingAria}
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
                      {m.rate}
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
                    {common.cancel}
                  </Button>
                ) : null}
                {rated ? (
                  <span className="text-xs text-emerald-700">
                    {m.ratedLabel.replace('{score}', Number(o.rating_score).toFixed(1))}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
        {orders.length === 0 ? <li className="py-3 text-sm text-slate-500">{m.empty}</li> : null}
      </ul>
    </section>
  );
}

function ProviderInboxPanel({
  orders,
  busyId,
  quoteAmounts,
  setQuoteAmounts,
  locale,
  copy,
  common,
  onQuote,
  onStart,
  onComplete,
  onCancel,
}: {
  orders: ServiceOrderDetail[];
  busyId: string | null;
  quoteAmounts: Record<string, string>;
  setQuoteAmounts: (v: Record<string, string>) => void;
  locale: AppLocale;
  copy: MonetizationCopy['marketplace'];
  common: MonetizationCopy['common'];
  onQuote: (o: ServiceOrderDetail) => void;
  onStart: (o: ServiceOrderDetail) => void;
  onComplete: (o: ServiceOrderDetail) => void;
  onCancel: (o: ServiceOrderDetail) => void;
}) {
  const inboxCopy = copy.inboxPanel;
  return (
    <section className="kuteka-detail-panel p-5">
      <h2 className="kuteka-detail-title">{inboxCopy.title}</h2>
      <p className="kuteka-detail-body mt-1">{inboxCopy.hint}</p>
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
                  <p className="mt-1 text-xs text-slate-500">
                    {o.quoted_amount_aoa != null || o.amount_aoa != null
                      ? formatAoaAmount(Number(o.quoted_amount_aoa ?? o.amount_aoa))
                      : copy.orderMeta.noQuote}
                  </p>
                </div>
                <Badge variant={orderStatusTone(o.status)}>
                  {orderStatusLabel(o.status, locale)}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {o.status === 'requested' || o.status === 'quoted' ? (
                  <div className="flex items-center gap-2">
                    <input
                      aria-label={inboxCopy.amountAria}
                      inputMode="numeric"
                      placeholder={inboxCopy.amountPlaceholder}
                      className="w-32 rounded-kuteka border border-slate-300 bg-white px-2 py-1 text-sm"
                      value={quoteAmounts[o.id] ?? String(o.amount_aoa ?? '')}
                      onChange={(e) => setQuoteAmounts({ ...quoteAmounts, [o.id]: e.target.value })}
                    />
                    <Button type="button" size="sm" loading={busy} onClick={() => onQuote(o)}>
                      {o.status === 'quoted' ? inboxCopy.requote : inboxCopy.sendQuote}
                    </Button>
                  </div>
                ) : null}
                {o.status === 'accepted' ? (
                  <Button type="button" size="sm" loading={busy} onClick={() => onStart(o)}>
                    {inboxCopy.startExecution}
                  </Button>
                ) : null}
                {o.status === 'in_progress' ? (
                  <Button type="button" size="sm" loading={busy} onClick={() => onComplete(o)}>
                    {inboxCopy.completeService}
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
                    {common.cancel}
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
        {orders.length === 0 ? (
          <li className="py-3 text-sm text-slate-500">{inboxCopy.empty}</li>
        ) : null}
      </ul>
    </section>
  );
}
