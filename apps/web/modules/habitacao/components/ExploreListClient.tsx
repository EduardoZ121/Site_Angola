'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PROPERTY_PURPOSES, PROPERTY_TYPES } from '@kuteka/validation';
import { Button, Heading, Input, Label, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { ForbiddenPanel } from '@/modules/shell/components/ForbiddenPanel';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getHabitacaoCopy } from '../content';
import {
  exploreActivePropertiesPage,
  getClientPreferences,
  type HousingPropertyRow,
} from '../services/housing-client';
import { PropertyCard } from './PropertyCard';

const PAGE_SIZE = 12;

type Filters = {
  purpose?: string;
  province?: string;
  city?: string;
  propertyType?: string;
  query?: string;
  futureAvailability?: boolean;
};

export function ExploreListClient() {
  const { locale } = useLocale();
  const copy = getHabitacaoCopy(locale);
  const searchParams = useSearchParams();
  const futureMode = searchParams?.get('disponibilidade') === 'futura';
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const canExplore =
    sessionStatus === 'ready' && !!session?.permissions.includes('housing.explore');
  const accessPending = sessionStatus === 'loading';
  const denied = sessionStatus === 'ready' && !canExplore;

  const [rows, setRows] = useState<HousingPropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<Filters>({ futureAvailability: futureMode });

  const [purpose, setPurpose] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [query, setQuery] = useState('');

  const sentinelRef = useRef<HTMLDivElement>(null);
  const inflight = useRef(false);

  const fetchPage = useCallback(
    async (nextOffset: number, nextFilters: Filters, replace: boolean) => {
      if (inflight.current) return;
      inflight.current = true;
      if (replace) setLoading(true);
      else setLoadingMore(true);

      const result = await exploreActivePropertiesPage({
        purpose: nextFilters.purpose || null,
        province: nextFilters.province || null,
        city: nextFilters.city || null,
        propertyType: nextFilters.propertyType || null,
        query: nextFilters.query || null,
        futureAvailability: nextFilters.futureAvailability,
        offset: nextOffset,
        limit: PAGE_SIZE,
      });

      if (!result.ok) {
        setError(result.message);
        if (replace) setRows([]);
        setHasMore(false);
      } else {
        setError(null);
        setRows((prev) => (replace ? result.data.rows : [...prev, ...result.data.rows]));
        setOffset(result.data.nextOffset);
        setHasMore(result.data.hasMore);
      }

      setLoading(false);
      setLoadingMore(false);
      inflight.current = false;
    },
    [],
  );

  function applyFilters(next: Filters) {
    setFilters(next);
    setOffset(0);
    setHasMore(true);
    void fetchPage(0, next, true);
  }

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!canExplore) {
        setLoading(false);
        return;
      }
      const prefs = await getClientPreferences();
      if (cancelled) return;
      const next: Filters = {
        purpose: prefs.ok && prefs.data?.purpose ? prefs.data.purpose : '',
        province: prefs.ok && prefs.data?.province ? prefs.data.province : '',
        city: prefs.ok && prefs.data?.city ? prefs.data.city : '',
        futureAvailability: futureMode,
      };
      setPurpose(next.purpose || '');
      setProvince(next.province || '');
      setCity(next.city || '');
      setFilters(next);
      await fetchPage(0, next, true);
    }
    if (sessionStatus === 'error') {
      setLoading(false);
      return;
    }
    if (sessionStatus === 'ready') void init();
    return () => {
      cancelled = true;
    };
  }, [canExplore, sessionStatus, fetchPage, futureMode]);

  useEffect(() => {
    if (!canExplore || loading || !hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;
    const scrollRoot = document.querySelector<HTMLElement>('.kuteka-app-scroll');
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void fetchPage(offset, filters, false);
        }
      },
      { root: scrollRoot, rootMargin: '480px 0px', threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canExplore, loading, hasMore, offset, filters, fetchPage]);

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-glass flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Heading level={1}>{futureMode ? 'Disponibilidade futura' : copy.exploreTitle}</Heading>
            <Text className="text-slate-600">
              {futureMode
                ? 'Imóveis que a Kuteka prevê libertar — active notificações e prepare a entrada.'
                : copy.exploreSubtitle}
            </Text>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={
                futureMode
                  ? '/app/habitacao/explorar'
                  : '/app/habitacao/explorar?disponibilidade=futura'
              }
              className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
            >
              {futureMode ? 'Ver activos' : 'Disponibilidade futura'}
            </Link>
            <Link
              href="/app/habitacao"
              className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
            >
              Preferências
            </Link>
            <Link
              href="/app/encontrar-casa"
              className={cn(buttonVariants({ variant: 'ghost' }), 'w-fit shrink-0')}
            >
              Encontrar Casa
            </Link>
          </div>
        </header>

        {accessPending ? <SoftListSlot pending /> : null}
        {denied ? (
          <ForbiddenPanel
            message={copy.needClient}
            primaryHref="/auth/onboarding/papeis"
            primaryLabel={copy.activateRole}
          />
        ) : null}

        {canExplore ? (
          <>
            <form
              className="kuteka-glass grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                applyFilters({
                  purpose,
                  province,
                  city,
                  propertyType,
                  query,
                  futureAvailability: futureMode,
                });
              }}
            >
              <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="q">{copy.search}</Label>
                <Input
                  id="q"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={copy.searchPlaceholder}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="purpose">{copy.fields.purpose}</Label>
                <select
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">{copy.fields.any}</option>
                  {PROPERTY_PURPOSES.map((p) => (
                    <option key={p} value={p}>
                      {copy.purposes[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="type">{copy.fields.type}</Label>
                <select
                  id="type"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">{copy.fields.any}</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {copy.types[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="province">{copy.fields.province}</Label>
                <Input
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city">{copy.fields.city}</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3">
                <Button type="submit" variant="primary">
                  {copy.applyFilters}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setPurpose('');
                    setProvince('');
                    setCity('');
                    setPropertyType('');
                    setQuery('');
                    applyFilters({});
                  }}
                >
                  {copy.clearFilters}
                </Button>
                <Text className="text-sm text-slate-500">
                  {rows.length}
                  {hasMore ? '+' : ''} {copy.results}
                </Text>
              </div>
            </form>

            <SoftListSlot pending={loading && rows.length === 0}>
              {error ? (
                <div
                  role="alert"
                  className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                >
                  {error}
                </div>
              ) : null}

              {!loading && !error && rows.length === 0 ? (
                <EmptyState
                  title={copy.emptyTitle}
                  description={copy.empty}
                  action={
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => {
                        setPurpose('');
                        setProvince('');
                        setCity('');
                        setPropertyType('');
                        setQuery('');
                        applyFilters({});
                      }}
                    >
                      {copy.emptyCta}
                    </Button>
                  }
                />
              ) : null}

              {rows.length > 0 ? (
                <>
                  <ul className="grid gap-4 sm:grid-cols-2">
                    {rows.map((row) => (
                      <li key={row.id} className="kuteka-feed-item">
                        <PropertyCard row={row} />
                      </li>
                    ))}
                  </ul>
                  <div ref={sentinelRef} className="h-8 w-full" aria-hidden />
                  {loadingMore ? (
                    <p className="py-2 text-center text-xs text-slate-500">{copy.loadingMore}</p>
                  ) : null}
                  {!hasMore ? (
                    <Text className="text-center text-sm text-slate-500">{copy.endOfResults}</Text>
                  ) : null}
                </>
              ) : null}
            </SoftListSlot>

            <FlowNextSteps
              title="Depois de explorar"
              steps={[
                { href: '/app/confianca', label: 'Verificar conta', primary: true },
                { href: '/app/agente', label: 'Ver acompanhamento' },
                ...(session?.permissions.includes('properties.manage')
                  ? [{ href: '/app/patrimonios', label: 'Publicar património' }]
                  : [{ href: '/app', label: 'Ir ao feed' }]),
              ]}
            />
          </>
        ) : null}
      </div>
    </SessionStatusGate>
  );
}
