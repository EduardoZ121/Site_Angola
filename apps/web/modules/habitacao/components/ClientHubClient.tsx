'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { ResidentOpsClient } from '@/modules/ops/components/ResidentOpsClient';
import { PreferencesForm } from './PreferencesForm';

type InterestRow = {
  id: string;
  property_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  properties?: { title: string; code: string; city: string | null } | null;
};

/**
 * Cliente hub — preferências, interesses/favoritos e visitas (fluxo Cliente).
 */
export function ClientHubClient() {
  const params = useSearchParams();
  const vista = params?.get('vista') || 'preferencias';
  const [interests, setInterests] = useState<InterestRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = createBrowserClient();
        const { data } = await client
          .from('property_interests')
          .select('id, property_id, status, notes, created_at, properties(title, code, city)')
          .order('created_at', { ascending: false })
          .limit(40);
        if (!cancelled) {
          const rows = (data as unknown as InterestRow[] | null) ?? [];
          setInterests(
            rows.map((row) => ({
              ...row,
              properties: Array.isArray(row.properties)
                ? (row.properties[0] ?? null)
                : (row.properties ?? null),
            })),
          );
        }
      } catch {
        if (!cancelled) setInterests([]);
      }
      if (!cancelled) setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <header className="kuteka-detail-panel flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kuteka-detail-eyebrow">Experiência Cliente</p>
          <Heading level={1}>Habitação</Heading>
          <Text className="mt-1 text-slate-600">
            Preferências, interesses, visitas e atalhos da sua jornada.
          </Text>
        </div>
        <Link
          href="/app/habitacao/explorar"
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'w-fit')}
        >
          Explorar Habitação
        </Link>
      </header>

      <nav
        className="kuteka-detail-panel flex flex-wrap gap-2 px-4 py-3"
        aria-label="Secções cliente"
      >
        {[
          { id: 'residencia', label: 'Residência', href: '/app/habitacao?vista=residencia' },
          { id: 'preferencias', label: 'Preferências', href: '/app/habitacao' },
          {
            id: 'interesses',
            label: 'Favoritos / Interesses',
            href: '/app/habitacao?vista=interesses',
          },
          { id: 'visitas', label: 'Visitas', href: '/app/habitacao?vista=visitas' },
        ].map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={
              vista === tab.id || (tab.id === 'preferencias' && !params?.get('vista'))
                ? 'kuteka-detail-chip kuteka-detail-chip--accent'
                : 'kuteka-detail-chip'
            }
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {vista === 'residencia' ? (
        <ResidentOpsClient />
      ) : vista === 'interesses' || vista === 'visitas' ? (
        <section className="kuteka-detail-panel p-5">
          <h2 className="kuteka-detail-title">
            {vista === 'visitas' ? 'Visitas & acompanhamento' : 'Favoritos / Interesses'}
          </h2>
          <p className="kuteka-detail-meta mt-1">
            {vista === 'visitas'
              ? 'Pedidos de interesse e estados de acompanhamento (visita / proposta).'
              : 'Imóveis em que demonstrou interesse na Kuteka.'}
          </p>
          {loading ? <p className="kuteka-detail-meta mt-4">A carregar…</p> : null}
          {!loading && interests.length === 0 ? (
            <div className="mt-4 flex flex-col gap-3">
              <p className="kuteka-detail-body">
                Ainda não há interesses registados. Explore o inventário e demonstre interesse nos
                imóveis.
              </p>
              <Link
                href="/app/habitacao/explorar"
                className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'w-fit')}
              >
                Explorar agora
              </Link>
            </div>
          ) : null}
          {interests.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-3">
              {interests.map((row) => (
                <li key={row.id} className="kuteka-detail-review">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {row.properties?.title ?? 'Património'}
                      </p>
                      <p className="kuteka-detail-meta font-mono">
                        {row.properties?.code}
                        {row.properties?.city ? ` · ${row.properties.city}` : ''}
                      </p>
                    </div>
                    <span className="kuteka-detail-chip kuteka-detail-chip--accent">
                      {row.status}
                    </span>
                  </div>
                  <p className="kuteka-detail-meta mt-2">
                    {new Date(row.created_at).toLocaleDateString('pt-AO')}
                  </p>
                  <Link
                    href={`/app/habitacao/detalhe?id=${row.property_id}`}
                    className="mt-2 inline-block text-sm font-semibold text-[#08263f] underline-offset-2 hover:underline"
                  >
                    Ver ficha
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : (
        <PreferencesForm />
      )}
    </div>
  );
}
