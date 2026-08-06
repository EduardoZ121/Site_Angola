'use client';

import Link from 'next/link';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { PropertyCard } from '@/modules/habitacao/components/PropertyCard';
import { exploreActivePropertiesPage } from '@/modules/habitacao/services/housing-client';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getShellCopy } from '../content';
import { appendFeedPage, type FeedStreamItem } from '../feed/feed-stream';
import { SoftListSlot } from './SoftListSlot';

const PAGE_SIZE = 12;

const FeedMarker = memo(function FeedMarker({
  title,
  hint,
  badge,
}: {
  title: string;
  hint: string;
  badge?: string;
}) {
  return (
    <div className="kuteka-feed-item kuteka-glass flex flex-wrap items-end justify-between gap-2 px-4 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold tracking-wide text-slate-900">{title}</h2>
          {badge ? <Badge variant="brand">{badge}</Badge> : null}
        </div>
        <Text className="mt-0.5 text-sm text-slate-600">{hint}</Text>
      </div>
    </div>
  );
});

const FeedLinkCard = memo(function FeedLinkCard({
  title,
  hint,
  href,
  cta,
}: {
  title: string;
  hint: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="kuteka-feed-item kuteka-glass flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-slate-900">{title}</p>
        <Text className="mt-1 text-sm text-slate-600">{hint}</Text>
      </div>
      <Link
        href={href}
        className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit shrink-0')}
      >
        {cta}
      </Link>
    </div>
  );
});

const FeedListing = memo(function FeedListing({
  item,
}: {
  item: Extract<FeedStreamItem, { kind: 'listing' }>;
}) {
  return (
    <div className="kuteka-feed-item">
      <PropertyCard row={item.row} />
    </div>
  );
});

/**
 * Continuous platform feed — infinite scroll, paginated Supabase reads.
 * Markers are inline in the stream (LinkedIn-style), not finite page sections.
 */
export function PlatformFeed({ canExplore }: { canExplore: boolean }) {
  const { locale } = useLocale();
  const shell = getShellCopy(locale);
  const [items, setItems] = useState<FeedStreamItem[]>([]);
  const [offset, setOffset] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const inflight = useRef(false);

  const loadPage = useCallback(
    async (nextOffset: number, nextPageIndex: number) => {
      if (!canExplore || inflight.current) return;
      inflight.current = true;
      if (nextOffset > 0) setLoadingMore(true);

      const result = await exploreActivePropertiesPage({
        offset: nextOffset,
        limit: PAGE_SIZE,
      });

      if (!result.ok) {
        setError(result.message);
        setHasMore(false);
        setHydrated(true);
        setLoadingMore(false);
        inflight.current = false;
        return;
      }

      setError(null);
      setItems((prev) => appendFeedPage(prev, result.data.rows, nextPageIndex));
      setOffset(result.data.nextOffset);
      setPageIndex(nextPageIndex + 1);
      setHasMore(result.data.hasMore);
      setHydrated(true);
      setLoadingMore(false);
      inflight.current = false;
    },
    [canExplore],
  );

  useEffect(() => {
    if (!canExplore) {
      setItems([]);
      setHydrated(true);
      setHasMore(false);
      return;
    }
    setItems([]);
    setOffset(0);
    setPageIndex(0);
    setHasMore(true);
    setHydrated(false);
    void loadPage(0, 0);
  }, [canExplore, loadPage]);

  useEffect(() => {
    if (!canExplore || !hydrated || !hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const scrollRoot =
      typeof document !== 'undefined'
        ? document.querySelector<HTMLElement>('.kuteka-app-scroll')
        : null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadPage(offset, pageIndex);
        }
      },
      { root: scrollRoot, rootMargin: '640px 0px', threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [canExplore, hydrated, hasMore, offset, pageIndex, loadPage]);

  if (!canExplore) {
    return (
      <div className="kuteka-glass p-5">
        <p className="font-medium text-slate-900">Active o papel Cliente para ver o feed</p>
        <Text className="mt-1 text-sm text-slate-600">
          O feed contínuo mostra patrimónios, destaques e recomendações assim que tiver acesso a
          Habitação.
        </Text>
        <Link
          href="/auth/onboarding/papeis"
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'mt-4 inline-flex')}
        >
          Activar papel
        </Link>
      </div>
    );
  }

  return (
    <SoftListSlot pending={!hydrated} minHeightClassName="min-h-[70vh]">
      {error ? (
        <div
          role="alert"
          className="kuteka-glass border border-amber-200 bg-amber-50/95 p-4 text-sm text-amber-950"
        >
          {error}
        </div>
      ) : null}

      {hydrated && !error && items.length === 0 ? (
        <div className="kuteka-glass p-5">
          <p className="font-medium text-slate-900">Feed a aquecer</p>
          <Text className="mt-1 text-sm text-slate-600">
            Ainda não há anúncios activos. Publique o primeiro património ou explore Habitação.
          </Text>
        </div>
      ) : null}

      {items.length ? (
        <div className="flex flex-col gap-4" role="feed" aria-busy={loadingMore || undefined}>
          {items.map((item) => {
            if (item.kind === 'marker') {
              return (
                <FeedMarker
                  key={item.key}
                  title={item.theme.title}
                  hint={item.theme.hint}
                  badge={item.theme.badge}
                />
              );
            }
            if (item.kind === 'link-card') {
              return (
                <FeedLinkCard
                  key={item.key}
                  title={item.title}
                  hint={item.hint}
                  href={item.href}
                  cta={item.cta}
                />
              );
            }
            return <FeedListing key={item.key} item={item} />;
          })}

          <div ref={sentinelRef} className="h-8 w-full" aria-hidden />

          {loadingMore ? (
            <p className="kuteka-detail-panel py-2 text-center text-xs text-stone-700">
              {shell.loadingMore}
            </p>
          ) : null}

          {!hasMore && items.length > 0 ? (
            <div className="kuteka-detail-panel px-4 py-4 text-center">
              <p className="text-sm font-medium text-slate-900">{shell.feedEndTitle}</p>
              <Text className="mt-1 text-sm text-stone-700">{shell.feedEndBody}</Text>
              <Link
                href="/app/habitacao/explorar"
                className={cn(
                  buttonVariants({ variant: 'secondary', size: 'sm' }),
                  'mt-3 inline-flex',
                )}
              >
                Explorar com filtros
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </SoftListSlot>
  );
}
