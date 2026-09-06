import { describe, expect, it } from 'vitest';
import { institutionalBadge } from './institutional-badge';

describe('institutionalBadge', () => {
  it('never surfaces the word Demo for system accounts', () => {
    const badge = institutionalBadge({ isSystemDemo: true });
    expect(badge?.label).toBeTruthy();
    expect(badge?.label.toLowerCase()).not.toContain('demo');
  });

  it('labels founders without Demo jargon', () => {
    expect(institutionalBadge({ isFounder: true })?.label.toLowerCase()).not.toContain('demo');
  });
});
