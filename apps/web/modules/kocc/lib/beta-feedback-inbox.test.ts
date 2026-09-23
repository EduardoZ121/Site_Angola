import { describe, expect, it } from 'vitest';
import { filterBetaInboxRows } from './beta-feedback-inbox';

describe('filterBetaInboxRows', () => {
  const rows = [
    { id: '1', kind: 'bug', status: 'received' },
    { id: '2', kind: 'feedback', status: 'em_analise' },
    { id: '3', kind: 'bug', status: 'resolvido' },
    { id: '4', kind: 'avaliacao', status: 'classificado' },
    { id: '5', kind: 'reclamacao', status: 'duplicado' },
  ];

  it('returns all for filter=all', () => {
    expect(filterBetaInboxRows(rows, 'all')).toHaveLength(5);
  });

  it('filters bugs and feedback', () => {
    expect(filterBetaInboxRows(rows, 'bug').map((r) => r.id)).toEqual(['1', '3']);
    expect(filterBetaInboxRows(rows, 'feedback').map((r) => r.id)).toEqual(['2']);
  });

  it('filters expanded kinds and open/closed status groups', () => {
    expect(filterBetaInboxRows(rows, 'avaliacao').map((r) => r.id)).toEqual(['4']);
    expect(filterBetaInboxRows(rows, 'reclamacao').map((r) => r.id)).toEqual(['5']);
    expect(filterBetaInboxRows(rows, 'open').map((r) => r.id)).toEqual(['1', '2', '4']);
    expect(filterBetaInboxRows(rows, 'resolvido').map((r) => r.id)).toEqual(['3', '5']);
  });
});
