'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Heading, Text } from '@kuteka/ui';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { PROVIDER_CATEGORIES, providerCategoryLabel } from '../lib/catalog';
import { listServiceProviders, type ServiceProviderRow } from '../services/monetization-client';
import { ProviderNetworkNav } from './ProviderNetworkNav';

export function FindProviderClient() {
  const params = useSearchParams();
  const initial = params.get('categoria') ?? 'all';
  const { status, error: sessionError } = useAppSession();
  const [category, setCategory] = useState(initial);
  const [rows, setRows] = useState<ServiceProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listServiceProviders(category);
    if (res.ok) {
      setRows(res.data);
      setError(null);
    } else {
      setError(res.message);
    }
    setLoading(false);
  }, [category]);

  useEffect(() => {
    if (status === 'ready') void load();
  }, [load, status]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [row.business_name, row.description, row.municipality, row.province, providerCategoryLabel(row.category)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [query, rows]);

  return (
    <SessionStatusGate status={status} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">Rede de prestadores</p>
          <Heading level={1}>Encontrar prestador</Heading>
          <Text className="mt-1 text-slate-700">
            Só aparecem fichas activas. Pedidos ainda por aprovar ficam fora desta lista.
          </Text>
          <div className="mt-4">
            <ProviderNetworkNav current="/app/servicos/encontrar" />
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          {PROVIDER_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={
                category === c.value
                  ? 'rounded-full bg-slate-900 px-3 py-1 text-sm text-white'
                  : 'rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-800'
              }
            >
              {c.label}
            </button>
          ))}
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Procurar nome, zona ou descrição"
          aria-label="Procurar prestador"
          className="kuteka-ops-input w-full"
        />

        {error ? (
          <p className="rounded-kuteka border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {error}
          </p>
        ) : null}

        <SoftListSlot pending={loading}>
          {rows.length === 0 ? (
            <p className="text-sm text-slate-600">Ainda não há prestador activo nesta categoria.</p>
          ) : shown.length === 0 ? (
            <p className="text-sm text-slate-600">Nenhum prestador neste filtro.</p>
          ) : (
            <ul className="grid gap-3">
              {shown.map((row) => (
                <li key={row.id} className="kuteka-detail-panel p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <Link href={`/app/servicos/ficha?id=${row.id}`} className="font-semibold text-slate-900 underline">
                        {row.business_name}
                      </Link>
                      <p className="text-sm text-slate-600">
                        {providerCategoryLabel(row.category)}
                        {row.municipality || row.province
                          ? ` · ${[row.municipality, row.province].filter(Boolean).join(', ')}`
                          : ''}
                      </p>
                    </div>
                    <Badge variant="success">
                      {row.rating ? `${Number(row.rating).toFixed(1)} ★` : 'Verificado na rede'}
                    </Badge>
                  </div>
                  {row.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-700">{row.description}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
