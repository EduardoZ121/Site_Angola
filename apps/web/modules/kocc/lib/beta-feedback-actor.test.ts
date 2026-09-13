import { describe, expect, it } from 'vitest';
import { formatBetaActorHint } from './beta-feedback-actor';

describe('formatBetaActorHint', () => {
  it('returns null for empty', () => {
    expect(formatBetaActorHint(null)).toBeNull();
    expect(formatBetaActorHint('')).toBeNull();
    expect(formatBetaActorHint('   ')).toBeNull();
  });

  it('prefixes truncated uuid', () => {
    expect(formatBetaActorHint('abcdef12-3456-7890-abcd-ef1234567890')).toBe('actor:abcdef12');
  });
});
