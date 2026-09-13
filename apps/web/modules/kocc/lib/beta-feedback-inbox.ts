/** Pure inbox filter for beta_feedback.kind — regression-safe, no new schema. */

export type BetaInboxFilter = 'all' | 'feedback' | 'bug';

export function filterBetaInboxRows<T extends { kind: string }>(
  rows: T[],
  filter: BetaInboxFilter,
): T[] {
  if (filter === 'all') return rows;
  return rows.filter((row) => row.kind === filter);
}
