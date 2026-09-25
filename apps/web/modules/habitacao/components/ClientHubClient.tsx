'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { LOCALE_INTL_TAG } from '@/modules/i18n/types';
import { ResidentOpsClient } from '@/modules/ops/components/ResidentOpsClient';
import { getHabitacaoCopy } from '../content';
import { visitRequestState } from '../lib/visit-request';
import { PreferencesForm } from './PreferencesForm';
import { cancelMyVisitRequest } from '../services/housing-client';

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
  const { locale } = useLocale();
  const copy = getHabitacaoCopy(locale);
  const params = useSearchParams();
  const vista = params?.get('vista') || 'preferencias';
  const [interests, setInterests] = useState<InterestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);

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

  const searchSince = useMemo(() => {
    if (interests.length === 0) return null;
    return interests.reduce((oldest, row) => (row.created_at < oldest ? row.created_at : oldest), interests[0]!.created_at);
  }, [interests]);
  const searchDays = searchSince
    ? Math.max(0, Math.floor((Date.now() - new Date(searchSince).getTime()) / 86_400_000))
    : null;
  const shown = vista === 'visitas'
    ? interests.filter((row) => visitRequestState(row.notes) !== 'none')
    : interests;

  function interestStatus(status: string): string {
    if (status === 'submitted') return 'Enviado';
    if (status === 'reviewing') return 'Em análise';
    if (status === 'assigned') return 'Atribuído';
    if (status === 'closed') return 'Fechado';
    return status;
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="kuteka-detail-panel flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="kuteka-detail-eyebrow">{copy.hub.eyebrow}</p>
          <Heading level={1}>{copy.title}</Heading>
          <Text className="mt-1 text-slate-600">{copy.hub.subtitle}</Text>
        </div>
        <Link
          href="/app/habitacao/explorar"
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'w-fit')}
        >
          {copy.explore}
        </Link>
      </header>

      <section className="kuteka-detail-panel p-5">
        <h2 className="text-sm font-semibold text-slate-900">Tempo de procura</h2>
        {loading ? <p className="mt-1 text-sm text-slate-600">{copy.hub.loading}</p> : null}
        {!loading && !searchSince ? (
          <p className="mt-1 text-sm text-slate-600">
            Ainda sem interesses registados. A data só aparece quando existir um pedido real.
          </p>
        ) : null}
        {!loading && searchSince ? (
          <p className="mt-1 text-sm text-slate-700">
            Interesse mais antigo visível: {new Date(searchSince).toLocaleDateString(LOCALE_INTL_TAG[locale])}
            {searchDays != null ? ` · ${searchDays} dia(s).` : '.'} Não há elevação automática para assistência prioritária. Essa regra comercial ainda não está activa.
          </p>
        ) : null}
        <Link href="/app/habitacao/explorar" className="mt-2 inline-block text-sm font-semibold text-brand-700 underline">
          Ver oportunidades
        </Link>
      </section>

      <nav
        className="kuteka-detail-panel flex flex-wrap gap-2 px-4 py-3"
        aria-label={copy.hub.navLabel}
      >
        {[
          {
            id: 'residencia',
            label: copy.hub.tabs.residencia,
            href: '/app/habitacao?vista=residencia',
          },
          { id: 'preferencias', label: copy.hub.tabs.preferencias, href: '/app/habitacao' },
          {
            id: 'interesses',
            label: copy.hub.tabs.interesses,
            href: '/app/habitacao?vista=interesses',
          },
          { id: 'visitas', label: copy.hub.tabs.visitas, href: '/app/habitacao?vista=visitas' },
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
            {vista === 'visitas' ? copy.hub.visits.title : copy.hub.favorites.title}
          </h2>
          <p className="kuteka-detail-meta mt-1">
            {vista === 'visitas'
              ? 'Só aparecem os pedidos em que indicou um dia. Aceite significa que o agente viu o pedido. A hora exacta combina-se por mensagem.'
              : copy.hub.favorites.description}
          </p>
          {loading ? <p className="kuteka-detail-meta mt-4">{copy.hub.loading}</p> : null}
          {!loading && shown.length === 0 ? (
            <div className="mt-4 flex flex-col gap-3">
              <p className="kuteka-detail-body">
                {vista === 'visitas'
                  ? 'Ainda não pediu visita. Abra a ficha de um imóvel e indique o dia.'
                  : copy.hub.emptyInterests}
              </p>
              <Link
                href="/app/habitacao/explorar"
                className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'w-fit')}
              >
                {copy.hub.exploreNow}
              </Link>
            </div>
          ) : null}
          {shown.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-3">
              {shown.map((row) => (
                <li key={row.id} className="kuteka-detail-review">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {row.properties?.title ?? copy.hub.propertyFallback}
                      </p>
                      <p className="kuteka-detail-meta font-mono">
                        {row.properties?.code}
                        {row.properties?.city ? ` · ${row.properties.city}` : ''}
                      </p>
                    </div>
                    <span className="kuteka-detail-chip kuteka-detail-chip--accent">
                      {interestStatus(row.status)}
                    </span>
                  </div>
                  {row.notes ? <p className="mt-2 text-sm text-slate-700">{row.notes}</p> : null}
                  {visitRequestState(row.notes) === 'accepted' ? (
                    <p className="mt-1 text-xs font-medium text-emerald-800">O agente aceitou o pedido.</p>
                  ) : null}
                  {visitRequestState(row.notes) === 'cancelled' ? (
                    <p className="mt-1 text-xs font-medium text-slate-500">Pedido cancelado por si.</p>
                  ) : null}
                  {vista === 'visitas' && visitRequestState(row.notes) === 'requested' ? (
                    <button
                      type="button"
                      className="mt-2 text-sm font-semibold text-slate-700 underline"
                      disabled={cancelId === row.id}
                      onClick={() => {
                        setCancelId(row.id);
                        void cancelMyVisitRequest(row.property_id).then((result) => {
                          setCancelId(null);
                          if (!result.ok) return;
                          setInterests((prev) =>
                            prev.map((item) =>
                              item.id === row.id
                                ? { ...item, notes: 'Pedido de visita cancelado pelo cliente.' }
                                : item,
                            ),
                          );
                        });
                      }}
                    >
                      {cancelId === row.id ? 'A cancelar…' : 'Cancelar pedido'}
                    </button>
                  ) : null}
                  <p className="kuteka-detail-meta mt-2">
                    {new Date(row.created_at).toLocaleDateString(LOCALE_INTL_TAG[locale])}
                  </p>
                  <Link
                    href={`/app/habitacao/detalhe?id=${row.property_id}`}
                    className="mt-2 inline-block text-sm font-semibold text-[#08263f] underline-offset-2 hover:underline"
                  >
                    {copy.hub.viewDetail}
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
