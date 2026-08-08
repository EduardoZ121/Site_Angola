'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { formatAoa } from '@/lib/format/aoa';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getListingsCopy } from '../content';

type CockpitMetrics = {
  views_30d: number;
  visits_30d: number;
  proposals_30d: number;
  estimated_yield_pct: number | null;
};

type ListingPerformanceCockpitProps = {
  propertyId: string;
  kutekaScore: number | null;
  priceAoa: number;
  purpose: string;
};

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-kuteka border border-stone-200 bg-white/90 px-3 py-2">
      <p className="kuteka-detail-micro">{label}</p>
      <p className="mt-0.5 text-base font-semibold tabular-nums text-stone-900">{value}</p>
    </div>
  );
}

/**
 * Cockpit de desempenho do anúncio — visualizações, interesse e leitura KAI.
 */
export function ListingPerformanceCockpit({
  propertyId,
  kutekaScore,
  priceAoa,
  purpose,
}: ListingPerformanceCockpitProps) {
  const { locale } = useLocale();
  const copy = getListingsCopy(locale).cockpit;
  const [metrics, setMetrics] = useState<CockpitMetrics | null>(null);
  const [favorites, setFavorites] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const client = createBrowserClient();
        const [m, fav] = await Promise.all([
          client
            .from('property_metrics')
            .select('views_30d, visits_30d, proposals_30d, estimated_yield_pct')
            .eq('property_id', propertyId)
            .maybeSingle(),
          client
            .from('property_interests')
            .select('id', { count: 'exact', head: true })
            .eq('property_id', propertyId)
            .is('deleted_at', null),
        ]);
        if (cancelled) return;
        setMetrics((m.data as CockpitMetrics) ?? null);
        setFavorites(fav.count ?? 0);
      } catch (err) {
        console.error('[ListingPerformanceCockpit]', err);
        if (!cancelled) {
          setMetrics(null);
          setFavorites(0);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const score = kutekaScore != null ? Math.round(Number(kutekaScore)) : null;
  const recommended =
    purpose === 'sale'
      ? Math.round(priceAoa * (score != null && score >= 75 ? 1.03 : 0.98))
      : Math.round(priceAoa * (score != null && score >= 75 ? 1.04 : 0.97));
  const probability =
    score == null
      ? '—'
      : score >= 80
        ? copy.probabilityHigh
        : score >= 60
          ? copy.probabilityMedium
          : copy.probabilityImprove;

  return (
    <section className="kuteka-detail-panel p-5" aria-labelledby="listing-cockpit">
      <h2 id="listing-cockpit" className="kuteka-detail-title">
        {copy.title}
      </h2>
      <p className="kuteka-detail-body mt-1">{copy.subtitle}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Chip label={copy.views} value={String(metrics?.views_30d ?? 0)} />
        <Chip label={copy.favorites} value={String(favorites)} />
        <Chip label={copy.visits} value={String(metrics?.visits_30d ?? 0)} />
        <Chip label={copy.proposals} value={String(metrics?.proposals_30d ?? 0)} />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <Chip label={copy.listingScore} value={score != null ? `${score}/100` : copy.unrated} />
        <Chip
          label={copy.recommendedPrice}
          value={formatAoa(recommended, purpose === 'sale' ? 'sale' : 'rent')}
        />
        <Chip
          label={purpose === 'sale' ? copy.saleProbability : copy.rentProbability}
          value={probability}
        />
      </div>
      {metrics?.estimated_yield_pct != null ? (
        <p className="mt-3 text-sm text-stone-700">
          {copy.estimatedYieldTemplate.replace(
            '{pct}',
            Number(metrics.estimated_yield_pct).toFixed(1),
          )}
        </p>
      ) : null}
    </section>
  );
}
