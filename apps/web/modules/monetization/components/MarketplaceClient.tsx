'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Heading, Label, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { formatAoaAmount } from '@/modules/finance/lib/format';
import {
  PROVIDER_CATEGORIES,
  createServiceOrder,
  listServiceOrders,
  listServiceProviders,
  type ServiceOrderRow,
  type ServiceProviderRow,
} from '@/modules/monetization/services/monetization-client';

/**
 * Marketplace de prestadores — pedido gera comissão no Ledger (B2B take-rate).
 */
export function MarketplaceClient() {
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const ready = sessionStatus === 'ready';
  const [category, setCategory] = useState('all');
  const [providers, setProviders] = useState<ServiceProviderRow[]>([]);
  const [orders, setOrders] = useState<ServiceOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState('Pedido de serviço');
  const [amount, setAmount] = useState('25000');

  const load = useCallback(async () => {
    setLoading(true);
    const [p, o] = await Promise.all([listServiceProviders(category), listServiceOrders()]);
    if (p.ok) setProviders(p.data);
    else setError(p.message);
    if (o.ok) setOrders(o.data);
    setLoading(false);
  }, [category]);

  useEffect(() => {
    if (ready) void load();
  }, [load, ready]);

  async function requestProvider(provider: ServiceProviderRow) {
    setBusyId(provider.id);
    setError(null);
    setMessage(null);
    const result = await createServiceOrder({
      providerId: provider.id,
      title: title.trim() || `Serviço ${provider.business_name}`,
      category: provider.category,
      description: `Pedido via marketplace Kuteka · ${provider.business_name}`,
      amountAoa: Number(amount) || 25000,
    });
    setBusyId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(
      `Pedido criado. Comissão estimada ${formatAoaAmount(Number(result.data.commission ?? 0))}.`,
    );
    await load();
  }

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">Prestadores</p>
          <Heading level={1}>Rede de serviços Kuteka</Heading>
          <Text className="mt-1 text-slate-700">
            Limpeza, mudanças, pintura, canalização e mais. O cliente pede; a comissão fica no
            Ledger (take-rate B2B — não escrow).
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="kuteka-detail-title">Prestadores activos</h2>
                <p className="kuteka-detail-body mt-1">Filtre por categoria e peça orçamento.</p>
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
                  <Label htmlFor="amt">Valor estimado (AOA)</Label>
                  <input
                    id="amt"
                    className="w-full min-w-[8rem] rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
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
                  <Button
                    type="button"
                    size="sm"
                    loading={busyId === p.id}
                    onClick={() => void requestProvider(p)}
                  >
                    Pedir serviço
                  </Button>
                </li>
              ))}
              {providers.length === 0 ? (
                <li className="py-3 text-sm text-slate-500">Sem prestadores nesta categoria.</li>
              ) : null}
            </ul>
          </section>

          <section className="kuteka-detail-panel p-5">
            <h2 className="kuteka-detail-title">Os meus pedidos</h2>
            <ul className="mt-3 divide-y divide-slate-200">
              {orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {o.title} ·{' '}
                      {Array.isArray(o.service_providers)
                        ? o.service_providers[0]?.business_name
                        : (o.service_providers?.business_name ?? o.category)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatAoaAmount(Number(o.amount_aoa ?? 0))} · comissão{' '}
                      {formatAoaAmount(Number(o.commission_aoa ?? 0))}
                    </p>
                  </div>
                  <Badge variant={o.status === 'requested' ? 'warning' : 'success'}>
                    {o.status}
                  </Badge>
                </li>
              ))}
              {orders.length === 0 ? (
                <li className="py-3 text-sm text-slate-500">Ainda sem pedidos.</li>
              ) : null}
            </ul>
          </section>
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
