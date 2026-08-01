'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PROPERTY_PURPOSES, PROPERTY_TYPES } from '@kuteka/validation';
import { Button, Heading, Input, Label, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { ForbiddenPanel } from '@/modules/shell/components/ForbiddenPanel';
import { ModuleSkeleton } from '@/modules/shell/components/ModuleSkeleton';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { getHabitacaoCopy } from '../content/pt';
import {
  exploreActiveProperties,
  getClientPreferences,
  type HousingPropertyRow,
} from '../services/housing-client';
import { PropertyCard } from './PropertyCard';

const PAGE_SIZE = 6;

export function ExploreListClient() {
  const copy = getHabitacaoCopy();
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const canExplore = session?.permissions.includes('housing.explore') ?? false;

  const [rows, setRows] = useState<HousingPropertyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [purpose, setPurpose] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [query, setQuery] = useState('');

  async function load(filters?: {
    purpose?: string;
    province?: string;
    city?: string;
    propertyType?: string;
    query?: string;
  }) {
    setLoading(true);
    const result = await exploreActiveProperties({
      purpose: filters?.purpose || null,
      province: filters?.province || null,
      city: filters?.city || null,
      propertyType: filters?.propertyType || null,
      query: filters?.query || null,
    });
    if (!result.ok) {
      setError(result.message);
      setRows([]);
    } else {
      setError(null);
      setRows(result.data);
      setPage(1);
    }
    setLoading(false);
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
      const nextPurpose = prefs.ok && prefs.data?.purpose ? prefs.data.purpose : '';
      const nextProvince = prefs.ok && prefs.data?.province ? prefs.data.province : '';
      const nextCity = prefs.ok && prefs.data?.city ? prefs.data.city : '';
      setPurpose(nextPurpose);
      setProvince(nextProvince);
      setCity(nextCity);
      // Apply saved preferences as the first filter pass so UI matches results.
      await load({
        purpose: nextPurpose,
        province: nextProvince,
        city: nextCity,
      });
    }
    if (sessionStatus === 'error') {
      setLoading(false);
      return;
    }
    if (sessionStatus === 'ready') void init();
    return () => {
      cancelled = true;
    };
  }, [canExplore, sessionStatus]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError} rows={4}>
      <div className="flex flex-col gap-8">
        <header className="kuteka-glass flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Heading level={1}>{copy.exploreTitle}</Heading>
            <Text className="text-slate-600">{copy.exploreSubtitle}</Text>
          </div>
          <Link
            href="/app/habitacao"
            className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
          >
            Preferências
          </Link>
        </header>

        {!canExplore ? (
          <ForbiddenPanel
            message={copy.needClient}
            primaryHref="/auth/onboarding/papeis"
            primaryLabel={copy.activateRole}
          />
        ) : null}

        {canExplore ? (
          <form
            className="kuteka-glass grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              void load({ purpose, province, city, propertyType, query });
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
              <Input id="province" value={province} onChange={(e) => setProvince(e.target.value)} />
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
                  void load({});
                }}
              >
                {copy.clearFilters}
              </Button>
              <Text className="text-sm text-slate-500">
                {rows.length} {copy.results}
              </Text>
            </div>
          </form>
        ) : null}

        {canExplore && loading ? <ModuleSkeleton rows={3} /> : null}
        {canExplore && error ? (
          <div
            role="alert"
            className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            {error}
          </div>
        ) : null}

        {!loading && !error && canExplore && rows.length === 0 ? (
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
                  void load({});
                }}
              >
                {copy.emptyCta}
              </Button>
            }
          />
        ) : null}

        {pageRows.length > 0 ? (
          <>
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pageRows.map((row) => (
                <li key={row.id}>
                  <PropertyCard row={row} />
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Text className="text-sm text-slate-500">
                {copy.pageOf} {page} / {pageCount}
              </Text>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {copy.pagePrev}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                >
                  {copy.pageNext}
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {canExplore ? (
          <FlowNextSteps
            title="Depois de explorar"
            steps={[
              { href: '/app/confianca', label: 'Verificar conta', primary: true },
              { href: '/app/agente', label: 'Ver acompanhamento' },
              ...(session?.permissions.includes('properties.manage')
                ? [{ href: '/app/patrimonios', label: 'Publicar património' }]
                : [{ href: '/app', label: 'Ir ao painel' }]),
            ]}
          />
        ) : null}
      </div>
    </SessionStatusGate>
  );
}
