'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heading, Badge, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { formatAoa } from '@/lib/format/aoa';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getPatrimoniosCopy } from '../content/pt';
import { getProperty, type PropertyRow } from '../services/properties-client';
import { listPropertyMedia, type PropertyMediaRow } from '../services/property-media-client';

export function PropertyDetailClient({ id }: { id: string }) {
  const copy = getPatrimoniosCopy();
  const [row, setRow] = useState<PropertyRow | null>(null);
  const [media, setMedia] = useState<PropertyMediaRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [prop, photos] = await Promise.all([getProperty(id), listPropertyMedia(id)]);
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
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const gallery = row
    ? media.length
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
        : []
    : [];

  return (
    <div className="flex flex-col gap-6">
      <header className="kuteka-glass flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Heading level={1}>{row?.title ?? copy.detailTitle}</Heading>
          {row ? (
            <>
              <p className="font-mono text-sm text-slate-500">{row.code}</p>
              <p className="text-lg font-semibold text-brand-800">
                {formatAoa(row.price_aoa, row.purpose)}
              </p>
            </>
          ) : null}
        </div>
        {row ? (
          <Badge variant={row.status === 'active' ? 'success' : 'default'}>
            {copy.statuses[row.status as keyof typeof copy.statuses] ?? row.status}
          </Badge>
        ) : null}
      </header>

      <SoftListSlot pending={loading && !row}>
        {error && !row ? (
          <>
            <EmptyState
              title={copy.loadError}
              description={error ?? 'Este património pode ter sido removido ou não está acessível.'}
              action={
                <Link
                  href="/app/patrimonios"
                  className={cn(buttonVariants({ variant: 'primary' }))}
                >
                  Ver patrimónios
                </Link>
              }
            />
            <FlowNextSteps
              steps={[
                { href: '/app/patrimonios/novo', label: copy.activate, primary: true },
                { href: '/app/confianca', label: 'Verificar conta' },
              ]}
            />
          </>
        ) : null}

        {row ? (
          <>
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
                      <img
                        src={m.public_url}
                        alt=""
                        className="h-16 w-24 object-cover"
                        loading="lazy"
                      />
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
                  <dd className="mt-1 text-slate-900">{row.bedrooms}</dd>
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
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {copy.fields.notes}
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-slate-900">{row.notes}</dd>
                </div>
              ) : null}
            </dl>

            <Text className="text-sm text-slate-500">
              Quando activo, este anúncio fica disponível em Habitação para o Cliente.
            </Text>

            <FlowNextSteps
              title="Anúncio publicado — continue o fluxo"
              steps={[
                {
                  href: `/app/habitacao/detalhe?id=${encodeURIComponent(row.id)}`,
                  label: copy.seeInHousing,
                  primary: true,
                },
                { href: '/app/confianca', label: 'Confiança' },
                { href: '/app/contratos', label: 'Contrato' },
                { href: '/app/patrimonios/novo', label: 'Publicar outro' },
              ]}
            />
          </>
        ) : null}
      </SoftListSlot>
    </div>
  );
}
