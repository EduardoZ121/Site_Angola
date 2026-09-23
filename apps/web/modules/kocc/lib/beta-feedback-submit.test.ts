import { describe, expect, it } from 'vitest';
import {
  isValidBetaFeedbackBody,
  isValidBetaFeedbackKind,
  isValidBetaFeedbackKindAny,
  normalizeBetaFeedbackBody,
  sanitizeBetaPagePath,
} from './beta-feedback-submit';

describe('sanitizeBetaPagePath', () => {
  it('returns null for empty', () => {
    expect(sanitizeBetaPagePath(null)).toBeNull();
    expect(sanitizeBetaPagePath('')).toBeNull();
    expect(sanitizeBetaPagePath('   ')).toBeNull();
  });

  it('strips unknown query and hash', () => {
    expect(sanitizeBetaPagePath('/app/ajuda?x=1#y')).toBe('/app/ajuda');
  });

  it('keeps allowlisted Help Center sec', () => {
    expect(sanitizeBetaPagePath('/app/ajuda?sec=faq')).toBe('/app/ajuda?sec=faq');
    expect(sanitizeBetaPagePath('/app/ajuda?sec=evil')).toBe('/app/ajuda');
  });

  it('extracts pathname from absolute URL', () => {
    expect(sanitizeBetaPagePath('https://kuteka.app/app/patrimonios?id=1')).toBe(
      '/app/patrimonios',
    );
  });

  it('truncates long paths', () => {
    const long = `/${'a'.repeat(600)}`;
    expect(sanitizeBetaPagePath(long)?.length).toBe(500);
  });
});

describe('beta feedback body/kind', () => {
  it('normalizes and validates body length', () => {
    expect(normalizeBetaFeedbackBody('  hi  ')).toBe('hi');
    expect(normalizeBetaFeedbackBody('a\u0000bc')).toBe('abc');
    expect(isValidBetaFeedbackBody('ab')).toBe(false);
    expect(isValidBetaFeedbackBody('abc')).toBe(true);
  });

  it('accepts only feedback|bug (legacy)', () => {
    expect(isValidBetaFeedbackKind('feedback')).toBe(true);
    expect(isValidBetaFeedbackKind('bug')).toBe(true);
    expect(isValidBetaFeedbackKind('ticket')).toBe(false);
    expect(isValidBetaFeedbackKind('avaliacao')).toBe(false);
  });

  it('accepts expanded kinds via isValidBetaFeedbackKindAny', () => {
    expect(isValidBetaFeedbackKindAny('avaliacao')).toBe(true);
    expect(isValidBetaFeedbackKindAny('reclamacao')).toBe(true);
  });
});
