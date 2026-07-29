import { describe, expect, it } from 'vitest';
import { cn, formatKz, isNonEmptyString } from './index';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('formatKz', () => {
  it('formats AOA amounts', () => {
    const formatted = formatKz(1500000);
    expect(formatted).toContain('1');
    expect(formatted.length).toBeGreaterThan(3);
  });
});

describe('isNonEmptyString', () => {
  it('rejects empty and non-strings', () => {
    expect(isNonEmptyString('a')).toBe(true);
    expect(isNonEmptyString('  ')).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
  });
});
