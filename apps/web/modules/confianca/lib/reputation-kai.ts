import type { AppLocale } from '@/modules/i18n/types';
import type { PropertyTrustSummary, UserTrustSummary } from '../services/reputation-client';
import { getConfiancaCopy } from '../content';
import { formatRatingValue, monthsSince } from './trust-format';

const EXCELLENT_RATING_THRESHOLD = 4.5;
const GOOD_RATING_THRESHOLD = 4;
const RECENT_MONTHS_WINDOW = 12;
const HIGH_ICK_THRESHOLD = 85;
const MAX_HINTS = 2;

/** KAI reputation hints for a property — short, factual, no "Demo" wording. */
export function buildPropertyReputationHints(
  summary: PropertyTrustSummary | null | undefined,
  locale: AppLocale = 'pt',
): string[] {
  if (!summary) return [];
  const copy = getConfiancaCopy(locale).reputationKai;
  const hints: string[] = [];

  const hasRating = summary.ratingAvg != null && summary.ratingCount > 0;
  const recentMonths = monthsSince(summary.lastReviewAt);
  const isRecent = recentMonths != null && recentMonths <= RECENT_MONTHS_WINDOW;

  if (hasRating && summary.ratingAvg! >= EXCELLENT_RATING_THRESHOLD && isRecent) {
    hints.push(copy.excellentRecent);
  } else if (hasRating && summary.ratingAvg! >= GOOD_RATING_THRESHOLD && isRecent) {
    hints.push(copy.goodRecent);
  }

  if (hasRating) {
    hints.push(
      copy.avgRatingTemplate
        .replace('{avg}', formatRatingValue(summary.ratingAvg, locale))
        .replace('{count}', String(summary.ratingCount)),
    );
  }

  if (summary.contractsCompleted > 0) {
    hints.push(copy.contractsTemplate.replace('{n}', String(summary.contractsCompleted)));
  }

  return hints.slice(0, MAX_HINTS);
}

/** KAI reputation hints for a user (owner / agent / client) profile. */
export function buildUserReputationHints(
  summary: UserTrustSummary | null | undefined,
  locale: AppLocale = 'pt',
): string[] {
  if (!summary) return [];
  const copy = getConfiancaCopy(locale).reputationKai;
  const hints: string[] = [];

  const hasRating = summary.ratingAvg != null && summary.ratingCount > 0;
  if (hasRating) {
    hints.push(
      copy.avgRatingTemplate
        .replace('{avg}', formatRatingValue(summary.ratingAvg, locale))
        .replace('{count}', String(summary.ratingCount)),
    );
  }

  if (summary.ickScore != null && summary.ickScore >= HIGH_ICK_THRESHOLD) {
    hints.push(copy.highIck);
  } else if (summary.contractsCompleted > 0 && (summary.trustIndex ?? 0) > 0) {
    hints.push(copy.trustedProfile);
  }

  if (summary.contractsCompleted > 0) {
    hints.push(copy.contractsTemplate.replace('{n}', String(summary.contractsCompleted)));
  }

  if (summary.kycLevel != null && summary.kycLevel >= 3) {
    hints.push(copy.verifiedIdentity.replace('{n}', String(summary.kycLevel)));
  }

  if (hints.length === 0) {
    hints.push(copy.newProfile);
  }

  return hints.slice(0, MAX_HINTS);
}
