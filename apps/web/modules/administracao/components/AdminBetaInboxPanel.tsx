'use client';

/**
 * Beta feedback inbox for Admin Hub.
 * Reuses beta_feedback SELECT RLS (finance.manage | admin.panel | Founder).
 * Status updates via kocc_update_beta_feedback_status (0046) with audit.
 */
import { useEffect, useMemo, useState } from 'react';
import { Text } from '@kuteka/ui';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { BetaFeedbackInboxItem } from '@/modules/kocc/components/BetaFeedbackInboxItem';
import { filterBetaInboxRows, type BetaInboxFilter } from '@/modules/kocc/lib/beta-feedback-inbox';
import { shouldShowSoftEmpty } from '@/modules/kocc/lib/soft-empty-gate';
import {
  listRecentBetaFeedback,
  updateBetaFeedbackStatus,
  type KoccBetaFeedbackRow,
} from '@/modules/kocc/services/kocc-client';

export function AdminBetaInboxPanel() {
  const [inbox, setInbox] = useState<KoccBetaFeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<BetaInboxFilter>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const res = await listRecentBetaFeedback(40);
      if (cancelled) return;
      if (res.ok) {
        setInbox(res.data);
        setError(null);
      } else {
        setInbox([]);
        setError(res.message);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => filterBetaInboxRows(inbox, filter), [inbox, filter]);

  async function onStatusChange(id: string, status: string, resolutionNotes?: string | null) {
    setUpdatingId(id);
    const res = await updateBetaFeedbackStatus({ id, status, resolutionNotes });
    setUpdatingId(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setInbox((prev) => prev.map((row) => (row.id === id ? { ...row, ...res.data } : row)));
  }

  return (
    <section
      id="beta-inbox"
      className="flex flex-col gap-3 rounded-kuteka border border-slate-200 bg-white p-4"
      aria-labelledby="admin-beta-inbox-heading"
    >
      <div className="flex flex-col gap-1">
        <h2 id="admin-beta-inbox-heading" className="text-sm font-semibold text-slate-800">
          Inbox Beta (triagem)
        </h2>
        <Text className="text-sm text-slate-500">
          Relatos de <code className="text-xs">/app/ajuda</code>. Visível com{' '}
          <code className="text-xs">admin.panel</code>,{' '}
          <code className="text-xs">finance.manage</code> ou Founder. Contexto de página e nota
          interna ficam nesta fila; o autor não recebe aviso.
        </Text>
      </div>

      {error ? <p className="text-sm text-amber-800">{error}</p> : null}

      {inbox.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-xs">
          {(
            [
              ['all', 'Todos'],
              ['open', 'Abertos'],
              ['bug', 'Bugs'],
              ['feedback', 'Sugestões'],
              ['avaliacao', 'Avaliações'],
              ['reclamacao', 'Reclamações'],
              ['resolvido', 'Fechados'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={
                filter === value
                  ? 'rounded border border-slate-800 bg-slate-900 px-2 py-1 text-white'
                  : 'rounded border border-slate-200 bg-white px-2 py-1 text-slate-700'
              }
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <SoftListSlot pending={loading && inbox.length === 0}>
        {shouldShowSoftEmpty({
          pending: loading,
          hasItems: inbox.length > 0,
          hasError: Boolean(error),
        }) ? (
          <p className="text-sm text-slate-500">Ainda sem relatos na inbox.</p>
        ) : null}
        {inbox.length > 0 && filtered.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum relato neste filtro.</p>
        ) : null}
        {filtered.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {filtered.map((row) => (
              <BetaFeedbackInboxItem
                key={row.id}
                row={row}
                busy={updatingId === row.id}
                canEdit
                onSave={({ status, resolutionNotes }) =>
                  void onStatusChange(row.id, status, resolutionNotes)
                }
              />
            ))}
          </ul>
        ) : null}
      </SoftListSlot>
    </section>
  );
}
