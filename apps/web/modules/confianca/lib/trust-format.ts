import { LOCALE_INTL_TAG, type AppLocale } from '@/modules/i18n/types';
import type { ConfiancaCopy } from '../content/pt';

/** Pure formatting helpers for the Trust Card — kept side-effect free for unit tests. */

export function formatIck(score: number | null | undefined): string {
  if (score == null || Number.isNaN(Number(score))) return '—';
  return String(Math.round(Number(score)));
}

export function formatRatingValue(
  avg: number | null | undefined,
  locale: AppLocale = 'pt',
): string {
  if (avg == null || Number.isNaN(Number(avg))) return '—';
  return new Intl.NumberFormat(LOCALE_INTL_TAG[locale], {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Number(avg));
}

export function formatRatingSummary(
  avg: number | null | undefined,
  count: number | null | undefined,
  copy: ConfiancaCopy['trustCard'],
  locale: AppLocale = 'pt',
): string {
  if (avg == null || !count) return copy.noRating;
  return copy.ratingTemplate
    .replace('{avg}', formatRatingValue(avg, locale))
    .replace('{count}', String(count));
}

export function formatContractsCompleted(count: number | null | undefined): string {
  if (count == null) return '—';
  return String(count);
}

export function formatAvgResponse(
  minutes: number | null | undefined,
  copy: ConfiancaCopy['trustCard'],
): string {
  if (minutes == null || Number.isNaN(Number(minutes)) || Number(minutes) < 0) {
    return copy.avgResponseUnknown;
  }
  return copy.avgResponseTemplate.replace('{n}', String(Math.round(Number(minutes))));
}

export function formatKisLevel(
  level: number | null | undefined,
  copy: ConfiancaCopy['trustCard'],
): string {
  if (level == null || Number.isNaN(Number(level))) return copy.notAvailable;
  return copy.kisLevelTemplate.replace('{n}', String(Math.round(Number(level))));
}

export function formatDateShort(
  value: string | null | undefined,
  locale: AppLocale = 'pt',
): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(LOCALE_INTL_TAG[locale], {
    year: 'numeric',
    month: 'short',
  });
}

export function monthsSince(
  value: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const ms = now.getTime() - d.getTime();
  if (ms < 0) return 0;
  return ms / (1000 * 60 * 60 * 24 * 30.44);
}
