'use client';

import { useEffect, useState } from 'react';
import { Text } from '@kuteka/ui';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getAdministracaoCopy } from '../content';
import { fetchKosOpsMetrics, type KosOpsMetrics } from '../services/governance-client';

type MetricKey =
  | 'kosInReview'
  | 'kosOverdueSla'
  | 'kosApproved7d'
  | 'kosRejected7d'
  | 'kosAvgApprovalHours'
  | 'kosRejectionRate'
  | 'kosInterestToContract'
  | 'kosOpenReports';

function formatMetric(key: MetricKey, metrics: KosOpsMetrics): string {
  switch (key) {
    case 'kosInReview':
      return String(metrics.publicationInReview);
    case 'kosOverdueSla':
      return String(metrics.publicationOverdueSla);
    case 'kosApproved7d':
      return String(metrics.publicationApproved7d);
    case 'kosRejected7d':
      return String(metrics.publicationRejected7d);
    case 'kosAvgApprovalHours':
      return String(metrics.avgApprovalHours30d);
    case 'kosRejectionRate':
      return `${metrics.rejectionRate7d}%`;
    case 'kosInterestToContract':
      return `${metrics.interestToContractRate}%`;
    case 'kosOpenReports':
      return String(metrics.contentReportsOpen);
    default:
      return '—';
  }
}

const METRIC_KEYS: MetricKey[] = [
  'kosInReview',
  'kosOverdueSla',
  'kosApproved7d',
  'kosRejected7d',
  'kosAvgApprovalHours',
  'kosRejectionRate',
  'kosInterestToContract',
  'kosOpenReports',
];

export function KosAnalyticsPanel() {
  const { locale } = useLocale();
  const copy = getAdministracaoCopy(locale);
  const [metrics, setMetrics] = useState<KosOpsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await fetchKosOpsMetrics();
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setMetrics(null);
      } else {
        setError(null);
        setMetrics(result.data);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="flex flex-col gap-3" aria-labelledby="kos-analytics-heading">
      <div className="flex flex-col gap-1">
        <h2 id="kos-analytics-heading" className="text-sm font-semibold text-slate-800">
          {copy.kosAnalyticsTitle}
        </h2>
        <Text className="text-sm text-slate-500">{copy.kosAnalyticsHint}</Text>
      </div>

      <SoftListSlot pending={loading && !metrics}>
        {error ? (
          <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {error}
          </div>
        ) : null}

        {!loading && !error && !metrics ? (
          <EmptyState title={copy.kosAnalyticsTitle} description={copy.loadError} />
        ) : null}

        {metrics ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {METRIC_KEYS.map((key) => (
              <li key={key} className="rounded-kuteka border border-slate-200 bg-white px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {copy[key]}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                  {formatMetric(key, metrics)}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </SoftListSlot>
    </section>
  );
}
