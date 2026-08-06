import { describe, expect, it } from 'vitest';
import { getConfiancaCopy } from '../content';
import {
  formatAvgResponse,
  formatContractsCompleted,
  formatDateShort,
  formatIck,
  formatKisLevel,
  formatRatingSummary,
  formatRatingValue,
  monthsSince,
} from './trust-format';

const trustCardCopy = getConfiancaCopy('pt').trustCard;

describe('trust-format', () => {
  it('formats ICK as a rounded integer, dash when missing', () => {
    expect(formatIck(88.4)).toBe('88');
    expect(formatIck(null)).toBe('—');
    expect(formatIck(undefined)).toBe('—');
  });

  it('formats rating value with locale decimal separator', () => {
    expect(formatRatingValue(4.9, 'pt')).toBe('4,9');
    expect(formatRatingValue(4.9, 'en')).toBe('4.9');
    expect(formatRatingValue(null)).toBe('—');
  });

  it('formats a rating summary or the no-rating fallback', () => {
    expect(formatRatingSummary(4.86, 12, trustCardCopy, 'pt')).toBe('4,9 (12)');
    expect(formatRatingSummary(null, 0, trustCardCopy, 'pt')).toBe(trustCardCopy.noRating);
    expect(formatRatingSummary(5, 0, trustCardCopy, 'pt')).toBe(trustCardCopy.noRating);
  });

  it('formats contracts completed', () => {
    expect(formatContractsCompleted(3)).toBe('3');
    expect(formatContractsCompleted(0)).toBe('0');
    expect(formatContractsCompleted(null)).toBe('—');
  });

  it('formats average response time or unknown', () => {
    expect(formatAvgResponse(42, trustCardCopy)).toBe('42 min');
    expect(formatAvgResponse(null, trustCardCopy)).toBe(trustCardCopy.avgResponseUnknown);
    expect(formatAvgResponse(-1, trustCardCopy)).toBe(trustCardCopy.avgResponseUnknown);
  });

  it('formats KIS level or not-available', () => {
    expect(formatKisLevel(3, trustCardCopy)).toBe('Nível 3');
    expect(formatKisLevel(null, trustCardCopy)).toBe(trustCardCopy.notAvailable);
  });

  it('formats a short date, dash when missing/invalid', () => {
    expect(formatDateShort('2024-03-15T00:00:00Z', 'pt')).not.toBe('—');
    expect(formatDateShort(null)).toBe('—');
    expect(formatDateShort('not-a-date')).toBe('—');
  });

  it('computes months since a date', () => {
    const now = new Date('2026-08-06T00:00:00Z');
    expect(monthsSince('2025-08-06T00:00:00Z', now)).toBeCloseTo(12, 0);
    expect(monthsSince(null, now)).toBeNull();
  });

  it('never renders internal "Demo" wording', () => {
    const values = [
      formatIck(80),
      formatRatingSummary(4.5, 3, trustCardCopy, 'pt'),
      formatContractsCompleted(2),
      formatAvgResponse(30, trustCardCopy),
      formatKisLevel(2, trustCardCopy),
    ];
    for (const value of values) {
      expect(value.toLowerCase()).not.toContain('demo');
    }
  });
});
