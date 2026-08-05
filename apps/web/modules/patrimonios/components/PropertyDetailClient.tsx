'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heading, Badge, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { formatAoa } from '@/lib/format/aoa';
import { PropertyShowcase } from '@/modules/listings/components/PropertyShowcase';
import { ListingPerformanceCockpit } from '@/modules/listings/components/ListingPerformanceCockpit';
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

  return (
    <div className="flex flex-col gap-5">
      <header className="kuteka-detail-panel flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Heading level={1}>{row?.title ?? copy.detailTitle}</Heading>
          {row ? (
            <>
              <p className="font-mono text-sm text-stone-600">{row.code}</p>
              <p className="kuteka-detail-price">{formatAoa(row.price_aoa, row.purpose)}</p>
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
              title="Começar de novo"
              kaiHint="Active um património ou complete a verificação da conta."
              steps={[
                { href: '/app/patrimonios/novo', label: copy.activate, primary: true },
                { href: '/app/centro-confianca', label: 'Centro de Confiança' },
              ]}
            />
          </>
        ) : null}

        {row ? (
          <>
            <PropertyShowcase
              row={row}
              media={media}
              activeUrl={activeUrl}
              onSelectMedia={setActiveUrl}
              typeLabel={
                copy.types[row.property_type as keyof typeof copy.types] ?? row.property_type
              }
              purposeLabel={copy.purposes[row.purpose as keyof typeof copy.purposes] ?? row.purpose}
            />

            <ListingPerformanceCockpit
              propertyId={row.id}
              kutekaScore={row.kuteka_score != null ? Number(row.kuteka_score) : null}
              priceAoa={Number(row.price_aoa) || 0}
              purpose={row.purpose}
            />

            <p className="kuteka-detail-panel px-4 py-3 text-sm text-stone-700">
              Quando activo, este anúncio fica disponível em Habitação para o Cliente — com a mesma
              ficha premium, mapa e reputação.
            </p>

            <FlowNextSteps
              title="Próximo passo sugerido"
              kaiHint="Partilhe o anúncio em Habitação para gerar visitas, ou avance para contrato quando tiver interessados."
              steps={[
                {
                  href: `/app/habitacao/detalhe?id=${encodeURIComponent(row.id)}`,
                  label: copy.seeInHousing,
                  primary: true,
                },
                { href: '/app/centro-confianca', label: 'Centro de Confiança' },
                { href: '/app/contratos/novo', label: 'Criar contrato' },
              ]}
            />
          </>
        ) : null}
      </SoftListSlot>
    </div>
  );
}
