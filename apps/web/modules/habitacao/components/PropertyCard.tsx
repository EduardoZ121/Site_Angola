import { memo } from 'react';
import Link from 'next/link';
import { Badge, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { formatAoa } from '@/lib/format/aoa';
import { getConfiancaCopy } from '@/modules/confianca/content';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getHabitacaoCopy } from '../content';
import { availabilityLabel } from '../lib/visit-request';
import type { HousingPropertyRow } from '../services/housing-client';

type PropertyCardProps = {
  row: HousingPropertyRow;
  /** Optional — pass through when the caller already has aggregate reputation
   *  data (avoids one fetch per card). Falls back to the row's own
   *  `kuteka_score` when omitted. */
  ratingAvg?: number | null;
  ratingCount?: number | null;
  onRetireDemo?: () => void;
};

function PropertyCardComponent({ row, ratingAvg, ratingCount, onRetireDemo }: PropertyCardProps) {
  const { locale } = useLocale();
  const copy = getHabitacaoCopy(locale);
  const trustCopy = getConfiancaCopy(locale).trustCard;
  const href = `/app/habitacao/detalhe?id=${encodeURIComponent(row.id)}`;
  const kutekaScore = row.kuteka_score != null ? Math.round(Number(row.kuteka_score)) : null;
  const later = availabilityLabel(row);
  const hasRating = ratingAvg != null && (ratingCount ?? 0) > 0;

  return (
    <article className="kuteka-glass flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link
        href={href}
        className="block aspect-[16/10] bg-slate-100"
        aria-label={copy.photoAriaTemplate.replace('{title}', row.title)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={row.cover_image_url || '/images/hero.jpg'}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">
            {copy.types[row.property_type as keyof typeof copy.types] ?? row.property_type}
          </Badge>
          <Badge variant="brand">
            {copy.purposes[row.purpose as keyof typeof copy.purposes] ?? row.purpose}
          </Badge>
          {row.is_demo ? <Badge variant="warning">Demo</Badge> : null}
          {later ? <Badge variant="warning">{later}</Badge> : null}
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            <Link href={href} className="hover:text-brand-800">
              {row.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm font-semibold text-brand-800">
            {formatAoa(row.price_aoa, row.purpose)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {[row.city, row.province].filter(Boolean).join(', ') || '—'}
            {row.bedrooms != null ? ` · T${row.bedrooms}` : ''}
          </p>
          {hasRating || kutekaScore != null ? (
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              {hasRating ? (
                <span className="inline-flex items-center gap-1">
                  <span className="text-[#f0a91f]" aria-hidden>
                    ★
                  </span>
                  <span className="font-mono font-semibold">{Number(ratingAvg).toFixed(1)}</span>
                  <span>({ratingCount})</span>
                </span>
              ) : null}
              {kutekaScore != null ? (
                <span className="font-mono" title={trustCopy.ickLabel}>
                  ICK {kutekaScore}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="mt-auto flex flex-wrap gap-2">
          <Link
            href={href}
            className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit')}
          >
            {copy.openDetail}
          </Link>
          {row.is_demo && onRetireDemo ? (
            <button
              type="button"
              onClick={onRetireDemo}
              className="text-sm font-semibold text-rose-800 underline-offset-2 hover:underline"
            >
              Retirar Demo
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export const PropertyCard = memo(PropertyCardComponent);
