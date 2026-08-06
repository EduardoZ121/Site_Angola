import { describe, expect, it } from 'vitest';
import { buildPropertyReputationHints, buildUserReputationHints } from './reputation-kai';
import type { PropertyTrustSummary, UserTrustSummary } from '../services/reputation-client';

function baseProperty(partial: Partial<PropertyTrustSummary> = {}): PropertyTrustSummary {
  return {
    propertyId: 'p1',
    kutekaScore: 88,
    ratingAvg: null,
    ratingCount: 0,
    contractsCompleted: 0,
    lastReviewAt: null,
    ...partial,
  };
}

function baseUser(partial: Partial<UserTrustSummary> = {}): UserTrustSummary {
  return {
    userId: 'u1',
    displayName: 'Parceiro Kuteka',
    trustIndex: 0,
    ickScore: null,
    kycLevel: 0,
    memberSince: null,
    lastActivityAt: null,
    ratingAvg: null,
    ratingCount: 0,
    contractsCompleted: 0,
    ...partial,
  };
}

describe('reputation-kai', () => {
  it('returns no hints without a summary', () => {
    expect(buildPropertyReputationHints(null)).toEqual([]);
    expect(buildUserReputationHints(undefined)).toEqual([]);
  });

  it('highlights excellent recent reputation for a well-rated, recently reviewed property', () => {
    const recent = new Date();
    recent.setMonth(recent.getMonth() - 1);
    const hints = buildPropertyReputationHints(
      baseProperty({ ratingAvg: 4.9, ratingCount: 12, lastReviewAt: recent.toISOString() }),
      'pt',
    );
    expect(hints[0]).toBe('Este imóvel possui excelente reputação nos últimos 12 meses.');
    expect(hints.some((h) => h.includes('4,9') && h.includes('12'))).toBe(true);
  });

  it('does not claim recent excellence when the last review is old', () => {
    const hints = buildPropertyReputationHints(
      baseProperty({ ratingAvg: 5, ratingCount: 4, lastReviewAt: '2019-01-01T00:00:00Z' }),
      'pt',
    );
    expect(hints.join(' ')).not.toContain('últimos 12 meses');
  });

  it('mentions contracts completed when present', () => {
    const hints = buildPropertyReputationHints(
      baseProperty({ contractsCompleted: 5, ratingAvg: 4.2, ratingCount: 5, lastReviewAt: null }),
    );
    expect(hints.some((h) => h.includes('5'))).toBe(true);
  });

  it('caps property hints at two entries', () => {
    const recent = new Date().toISOString();
    const hints = buildPropertyReputationHints(
      baseProperty({ ratingAvg: 5, ratingCount: 20, contractsCompleted: 10, lastReviewAt: recent }),
    );
    expect(hints.length).toBeLessThanOrEqual(2);
  });

  it('builds user hints with a locale-formatted average rating', () => {
    const hints = buildUserReputationHints(
      baseUser({ ratingAvg: 4.86, ratingCount: 9, contractsCompleted: 3, trustIndex: 70 }),
      'pt',
    );
    expect(hints.some((h) => h.includes('4,9') && h.includes('9'))).toBe(true);
  });

  it('falls back to a "new profile" hint when there is no history yet', () => {
    const hints = buildUserReputationHints(baseUser());
    expect(hints).toHaveLength(1);
    expect(hints[0]).toBe('Perfil ainda a construir histórico de reputação.');
  });

  it('mentions verified identity for high KIS levels', () => {
    const hints = buildUserReputationHints(baseUser({ kycLevel: 3, contractsCompleted: 1 }));
    expect(hints.some((h) => h.includes('KIS 3'))).toBe(true);
  });

  it('never renders internal "Demo" wording', () => {
    const propertyHints = buildPropertyReputationHints(
      baseProperty({ ratingAvg: 4.9, ratingCount: 3, contractsCompleted: 2 }),
    );
    const userHints = buildUserReputationHints(
      baseUser({ ratingAvg: 4.5, ratingCount: 2, ickScore: 90, kycLevel: 4 }),
    );
    for (const hint of [...propertyHints, ...userHints]) {
      expect(hint.toLowerCase()).not.toContain('demo');
    }
  });
});
