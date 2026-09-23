/** Pure inbox filter for beta_feedback.kind / status — migration 0046. */

export type BetaInboxFilter =
  'all' | 'feedback' | 'bug' | 'avaliacao' | 'reclamacao' | 'open' | 'resolvido';

const OPEN_STATUSES = new Set(['received', 'em_analise', 'classificado', 'em_desenvolvimento']);

export function filterBetaInboxRows<T extends { kind: string; status?: string | null }>(
  rows: T[],
  filter: BetaInboxFilter,
): T[] {
  if (filter === 'all') return rows;
  if (filter === 'open') {
    return rows.filter((row) => !row.status || OPEN_STATUSES.has(row.status));
  }
  if (filter === 'resolvido') {
    return rows.filter(
      (row) =>
        row.status === 'resolvido' ||
        row.status === 'duplicado' ||
        row.status === 'nao_reproduzivel',
    );
  }
  return rows.filter((row) => row.kind === filter);
}
