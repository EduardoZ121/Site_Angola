'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { providerCategoryLabel } from '../lib/catalog';
import {
  fetchMarketplaceContext,
  listProviderInbox,
} from '../services/marketplace-client';
import {
  listProvidersForReview,
  setProviderActive,
  type ServiceProviderRow,
} from '../services/monetization-client';
import { ProviderNetworkNav } from './ProviderNetworkNav';

const TODAY = [
  { href: '/app/servicos', label: 'Pedidos e serviços' },
  { href: '/app/mensagens', label: 'Mensagens' },
  { href: '/app/servicos/campanhas', label: 'Campanhas' },
  { href: '/app/financeiro', label: 'Financeiro (leitura)' },
  { href: '/app/servicos/encontrar', label: 'A minha ficha pública' },
];

export function ProviderAreaClient() {
  const { status, error: sessionError } = useAppSession();
  const [loading, setLoading] = useState(true);
  const [inboxCount, setInboxCount] = useState(0);
  const [isProvider, setIsProvider] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [queue, setQueue] = useState<ServiceProviderRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const ctx = await fetchMarketplaceContext();
    if (ctx.ok) {
      setIsProvider(ctx.data.isProvider);
      setCanManage(ctx.data.canManage);
      const ids = ctx.data.providers.map((p) => p.id);
      if (ids.length > 0) {
        const inbox = await listProviderInbox(ids);
        if (inbox.ok) setInboxCount(inbox.data.length);
      }
      if (ctx.data.canManage) {
        const review = await listProvidersForReview();
        if (review.ok) setQueue(review.data);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === 'ready') void load();
  }, [load, status]);

  async function toggle(row: ServiceProviderRow) {
    setBusyId(row.id);
    setError(null);
    const res = await setProviderActive(row.id, !row.active);
    setBusyId(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(row.active ? `${row.business_name} suspenso.` : `${row.business_name} activo.`);
    await load();
  }

  const pending = queue.filter((row) => !row.active);
  const shownQueue = useMemo(() => {
    const base = pending.length > 0 ? pending : queue;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((row) =>
      [row.business_name, providerCategoryLabel(row.category), row.phone]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [pending, query, queue]);

  return (
    <SessionStatusGate status={status} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">Cockpit do prestador</p>
          <Heading level={1}>Área do prestador</Heading>
          <Text className="mt-1 text-slate-700">
            {isProvider
              ? `Hoje tem ${inboxCount} pedido(s) na caixa. O pagamento continua no Kuteka Pay de teste.`
              : 'O pedido de empresa fica pendente até um Administrador, o Super Admin ou um Founder o activar. Não precisa de ser o Owner.'}
          </Text>
          <div className="mt-4">
            <ProviderNetworkNav current="/app/servicos/area" />
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          {TODAY.map((item) => (
            <Link key={item.href + item.label} href={item.href} className="kuteka-detail-panel p-4 text-sm font-medium text-slate-900">
              {item.label}
            </Link>
          ))}
          <Link href="/app/servicos/publicidade" className="kuteka-detail-panel p-4 text-sm font-medium text-slate-900">
            Publicidade e destaque
          </Link>
        </section>

        {message ? (
          <p className="rounded-kuteka border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</p>
        ) : null}
        {error ? (
          <p className="rounded-kuteka border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>
        ) : null}

        {canManage ? (
          <SoftListSlot pending={loading}>
            <section className="kuteka-detail-panel p-5">
              <h2 className="text-sm font-semibold text-slate-900">Aprovar empresas</h2>
              <p className="mt-1 text-sm text-slate-600">
                Pendente não é público. Administrador, Super Admin ou Founder podem activar. O Owner não é obrigatório.
                Não há estado “rejeitado” separado: isso exigiria uma coluna nova.
              </p>
              {queue.length > 0 ? (
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Procurar nome ou categoria"
                  aria-label="Procurar na fila de prestadores"
                  className="kuteka-ops-input mt-3 w-full"
                />
              ) : null}
              <ul className="mt-3 divide-y divide-slate-200">
                {shownQueue.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{row.business_name}</p>
                      <p className="text-sm text-slate-600">
                        {providerCategoryLabel(row.category)}
                        {row.phone ? ` · ${row.phone}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={row.active ? 'success' : 'warning'}>{row.active ? 'Activo' : 'Pendente'}</Badge>
                      <Button type="button" size="sm" variant="secondary" loading={busyId === row.id} onClick={() => void toggle(row)}>
                        {row.active ? 'Suspender' : 'Activar'}
                      </Button>
                      {row.active ? (
                        <Link href={`/app/servicos/ficha?id=${row.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
                          Ficha
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
                {queue.length === 0 ? <li className="py-3 text-sm text-slate-600">Sem prestadores visíveis para esta conta.</li> : null}
                {queue.length > 0 && shownQueue.length === 0 ? (
                  <li className="py-3 text-sm text-slate-600">Nenhum prestador neste filtro.</li>
                ) : null}
              </ul>
            </section>
          </SoftListSlot>
        ) : (
          <p className="text-sm text-slate-600">
            A fila de aprovação só abre para quem gere o financeiro. O prestador acompanha os pedidos em Serviços.
          </p>
        )}
      </div>
    </SessionStatusGate>
  );
}
