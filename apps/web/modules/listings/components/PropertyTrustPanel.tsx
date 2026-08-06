'use client';

import { useEffect, useState } from 'react';
import { TrustCard } from '@/modules/confianca/components/TrustCard';
import { buildPropertyReputationHints } from '@/modules/confianca/lib/reputation-kai';
import {
  loadPropertyTrustSummary,
  type PropertyTrustSummary,
} from '@/modules/confianca/services/reputation-client';
import { useLocale } from '@/modules/i18n/LocaleProvider';

/**
 * Connects the shared Trust Card to a property — reputation should never be
 * buried, so this sits near the top of the Property Showcase (below gallery).
 */
export function PropertyTrustPanel({ propertyId }: { propertyId: string }) {
  const { locale } = useLocale();
  const [summary, setSummary] = useState<PropertyTrustSummary | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await loadPropertyTrustSummary(propertyId);
      if (cancelled) return;
      if (result.ok) setSummary(result.data);
      setLoaded(true);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  if (!loaded || !summary) return null;

  return (
    <TrustCard
      ick={summary.kutekaScore}
      ratingAvg={summary.ratingAvg}
      ratingCount={summary.ratingCount}
      contractsCompleted={summary.contractsCompleted}
      kaiHints={buildPropertyReputationHints(summary, locale)}
    />
  );
}
