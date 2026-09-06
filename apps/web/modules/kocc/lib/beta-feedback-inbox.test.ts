import { describe, expect, it } from 'vitest';
import { filterBetaInboxRows } from './beta-feedback-inbox';

describe('filterBetaInboxRows', () => {
  const rows = [
    { id: '1', kind: 'bug' },
    { id: '2', kind: 'feedback' },
    { id: '3', kind: 'bug' },
  ];

  it('returns all for filter=all', () => {
    expect(filterBetaInboxRows(rows, 'all')).toHaveLength(3);
  });

  it('filters bugs and feedback', () => {
    expect(filterBetaInboxRows(rows, 'bug').map((r) => r.id)).toEqual(['1', '3']);
    expect(filterBetaInboxRows(rows, 'feedback').map((r) => r.id)).toEqual(['2']);
  });
});
