import { describe, expect, it } from 'vitest';
import { shouldShowSoftEmpty } from './soft-empty-gate';

describe('shouldShowSoftEmpty', () => {
  it('shows empty only when idle with no items and no error', () => {
    expect(shouldShowSoftEmpty({ pending: false, hasItems: false, hasError: false })).toBe(true);
  });

  it('hides empty while pending, when items exist, or when errored', () => {
    expect(shouldShowSoftEmpty({ pending: true, hasItems: false, hasError: false })).toBe(false);
    expect(shouldShowSoftEmpty({ pending: false, hasItems: true, hasError: false })).toBe(false);
    expect(shouldShowSoftEmpty({ pending: false, hasItems: false, hasError: true })).toBe(false);
  });
});
