'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Heading, Badge, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { formatAoa } from '@/lib/format/aoa';
import { PropertyShowcase } from '@/modules/listings/components/PropertyShowcase';
import { ListingPerformanceCockpit } from '@/modules/listings/components/ListingPerformanceCockpit';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { MessagePropertyOwnerButton } from '@/modules/mensagens/components/MessagePropertyOwnerButton';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getPatrimoniosCopy } from '../content';
import { getProperty, type PropertyRow } from '../services/properties-client';
import { listPropertyMedia, type PropertyMediaRow } from '../services/property-media-client';

export function PropertyDetailClient({ id }: { id: string }) {
  const { locale } = useLocale();
  const copy = getPatrimoniosCopy(locale);
  const searchParams = useSearchParams();
  const showSubmittedBanner = searchParams.get('submitted') === '1';
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
      {showSubmittedBanner ? (
        <div
          className="rounded-kuteka border border-emerald-300/50 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
          role="status"
        >
          {copy.submittedForReview}
        </div>
      ) : null}

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
              description={error ?? copy.nextSteps.detailErrorHint}
              action={
                <Link
                  href="/app/patrimonios"
                  className={cn(buttonVariants({ variant: 'primary' }))}
                >
                  {copy.nextSteps.seeProperties}
                </Link>
              }
            />
            <FlowNextSteps
              title={copy.nextSteps.startOverTitle}
              kaiHint={copy.nextSteps.startOverHint}
              steps={[
                { href: '/app/patrimonios/novo', label: copy.activate, primary: true },
                { href: '/app/centro-confianca', label: copy.nextSteps.trustCenter },
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
              {copy.detailNote}
            </p>

            <MessagePropertyOwnerButton
              propertyId={row.id}
              ownerId={row.owner_id}
              propertyTitle={row.title}
            />

            <FlowNextSteps
              title={copy.nextSteps.suggestedTitle}
              kaiHint={copy.nextSteps.suggestedHint}
              steps={[
                ...(row.status === 'active'
                  ? [
                      {
                        href: `/app/habitacao/detalhe?id=${encodeURIComponent(row.id)}`,
                        label: copy.seeInHousing,
                        primary: true,
                      },
                    ]
                  : []),
                { href: '/app/centro-confianca', label: copy.nextSteps.trustCenter },
                { href: '/app/contratos/novo', label: copy.nextSteps.createContract },
              ]}
            />
          </>
        ) : null}
      </SoftListSlot>
    </div>
  );
}
