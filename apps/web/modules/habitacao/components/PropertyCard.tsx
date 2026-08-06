import { memo } from 'react';
import Link from 'next/link';
import { Badge, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { formatAoa } from '@/lib/format/aoa';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getHabitacaoCopy } from '../content';
import type { HousingPropertyRow } from '../services/housing-client';

function PropertyCardComponent({ row }: { row: HousingPropertyRow }) {
  const { locale } = useLocale();
  const copy = getHabitacaoCopy(locale);
  const href = `/app/habitacao/detalhe?id=${encodeURIComponent(row.id)}`;

  return (
    <article className="kuteka-glass flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link
        href={href}
        className="block aspect-[16/10] bg-slate-100"
        aria-label={`Fotografia: ${row.title}`}
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
          {row.is_demo ? <Badge variant="default">Demo</Badge> : null}
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
        </div>
        <Link
          href={href}
          className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-auto w-fit')}
        >
          {copy.openDetail}
        </Link>
      </div>
    </article>
  );
}

export const PropertyCard = memo(PropertyCardComponent);
