'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Button, Heading, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { formatAoa } from '@/lib/format/aoa';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { ModuleSkeleton } from '@/modules/shell/components/ModuleSkeleton';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import {
  listPropertyMedia,
  type PropertyMediaRow,
} from '@/modules/patrimonios/services/property-media-client';
import { getHabitacaoCopy } from '../content/pt';
import {
  expressInterest,
  getActiveProperty,
  listMyInterests,
  type HousingPropertyRow,
} from '../services/housing-client';

export function HousingDetailClient({ id }: { id: string }) {
  const copy = getHabitacaoCopy();
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const canExplore = session?.permissions.includes('housing.explore') ?? false;

  const [row, setRow] = useState<HousingPropertyRow | null>(null);
  const [media, setMedia] = useState<PropertyMediaRow[]>([]);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [hasInterest, setHasInterest] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [prop, photos, interests] = await Promise.all([
        getActiveProperty(id),
        listPropertyMedia(id),
        canExplore ? listMyInterests() : Promise.resolve({ ok: true as const, data: [] }),
      ]);
      if (cancelled) return;
      if (!prop.ok) {
        setError(prop.message);
        setRow(null);
      } else {
        setError(null);
        setRow(prop.data);
        setActiveUrl(prop.data.cover_image_url);
      }
      if (photos.ok) {
        setMedia(photos.data);
        const primary = photos.data.find((m) => m.is_primary) ?? photos.data[0];
        if (primary) setActiveUrl(primary.public_url);
      }
      if (interests.ok) {
        setHasInterest(interests.data.some((i) => i.property_id === id));
      }
      setLoading(false);
    }
    if (sessionStatus === 'error') {
      setLoading(false);
      return;
    }
    if (sessionStatus === 'ready') void load();
    return () => {
      cancelled = true;
    };
  }, [id, canExplore, sessionStatus]);

  async function onInterest() {
    setBusy(true);
    setMessage(null);
    setError(null);
    const result = await expressInterest({ propertyId: id });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setHasInterest(true);
    setMessage(copy.interestDone);
  }

  if (sessionStatus !== 'ready') {
    return (
      <SessionStatusGate status={sessionStatus} error={sessionError} rows={4}>
        {null}
      </SessionStatusGate>
    );
  }

  if (loading) return <ModuleSkeleton rows={4} />;

  if (error || !row) {
    return (
      <div className="flex flex-col gap-6">
        <Heading level={1}>{copy.detailTitle}</Heading>
        <EmptyState
          title={copy.loadError}
          description={error ?? 'Este anúncio pode já não estar activo.'}
          action={
            <Link
              href="/app/habitacao/explorar"
              className={cn(buttonVariants({ variant: 'primary' }))}
            >
              Explorar habitação
            </Link>
          }
        />
        <FlowNextSteps
          steps={[
            { href: '/app/habitacao/explorar', label: 'Explorar inventário', primary: true },
            { href: '/app/confianca', label: 'Verificar conta' },
          ]}
        />
      </div>
    );
  }

  const gallery = media.length
    ? media
    : row.cover_image_url
      ? [
          {
            id: 'cover',
            property_id: row.id,
            storage_path: null,
            public_url: row.cover_image_url,
            sort_order: 0,
            is_primary: true,
          },
        ]
      : [];

  return (
    <div className="flex flex-col gap-6">
      <header className="kuteka-glass flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Heading level={1}>{row.title}</Heading>
          <p className="font-mono text-sm text-slate-500">{row.code}</p>
          <p className="text-lg font-semibold text-brand-800">
            {formatAoa(row.price_aoa, row.purpose)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Activo</Badge>
          {row.is_demo ? <Badge variant="default">Demo</Badge> : null}
        </div>
      </header>

      {activeUrl ? (
        <div className="overflow-hidden rounded-kuteka border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activeUrl} alt="" className="aspect-[16/9] w-full object-cover" />
        </div>
      ) : null}

      {gallery.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {gallery.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setActiveUrl(m.public_url)}
                aria-label={`Fotografia ${m.sort_order + 1} de ${row.title}`}
                aria-pressed={activeUrl === m.public_url}
                className={cn(
                  'block overflow-hidden rounded-kuteka border',
                  activeUrl === m.public_url ? 'border-brand-500' : 'border-slate-200',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.public_url} alt="" className="h-16 w-24 object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {copy.fields.type}
          </dt>
          <dd className="mt-1 text-slate-900">
            {copy.types[row.property_type as keyof typeof copy.types] ?? row.property_type}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {copy.fields.purpose}
          </dt>
          <dd className="mt-1 text-slate-900">
            {copy.purposes[row.purpose as keyof typeof copy.purposes] ?? row.purpose}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {copy.fields.province}
          </dt>
          <dd className="mt-1 text-slate-900">{row.province || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {copy.fields.city}
          </dt>
          <dd className="mt-1 text-slate-900">{row.city || '—'}</dd>
        </div>
        {row.bedrooms != null ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {copy.fields.bedrooms}
            </dt>
            <dd className="mt-1 text-slate-900">T{row.bedrooms}</dd>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {copy.fields.address}
          </dt>
          <dd className="mt-1 text-slate-900">{row.address_line || '—'}</dd>
        </div>
        {row.notes ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Notas</dt>
            <dd className="mt-1 whitespace-pre-wrap text-slate-900">{row.notes}</dd>
          </div>
        ) : null}
      </dl>

      {message ? (
        <div className="rounded-kuteka border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {error}
        </div>
      ) : null}

      <div className="kuteka-glass flex flex-wrap gap-3 p-4">
        {canExplore ? (
          <Button
            type="button"
            variant="primary"
            disabled={busy || hasInterest}
            onClick={() => void onInterest()}
          >
            {busy ? copy.interestBusy : hasInterest ? copy.interestDone : copy.interest}
          </Button>
        ) : null}
        <Link href="/app/confianca" className={cn(buttonVariants({ variant: 'secondary' }))}>
          {copy.goTrust}
        </Link>
        <Link href="/app/agente" className={cn(buttonVariants({ variant: 'secondary' }))}>
          {copy.goAgent}
        </Link>
      </div>

      <FlowNextSteps
        title="Continuar o percurso"
        steps={[
          { href: '/app/agente', label: 'Agente acompanha', primary: true },
          { href: '/app/confianca', label: 'Confiança verifica' },
          { href: '/app/habitacao/explorar', label: 'Mais patrimónios' },
        ]}
      />
    </div>
  );
}
