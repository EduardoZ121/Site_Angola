'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { ForbiddenPanel } from '@/modules/shell/components/ForbiddenPanel';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getConfiancaCopy } from '../content';
import {
  listPendingTrustDocuments,
  reviewTrustDocument,
  type TrustDocumentRow,
} from '../services/trust-client';

export function TrustReviewClient() {
  const { locale } = useLocale();
  const copy = getConfiancaCopy(locale);
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const allowed = sessionStatus === 'ready' && !!session?.permissions.includes('admin.panel');
  const accessPending = sessionStatus === 'loading';
  const denied = sessionStatus === 'ready' && !allowed;

  const [rows, setRows] = useState<TrustDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');

  async function reload() {
    const result = await listPendingTrustDocuments();
    if (!result.ok) {
      setError(result.message);
      setRows([]);
      return;
    }
    setError(null);
    setRows(result.data);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!allowed) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const result = await listPendingTrustDocuments();
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setRows([]);
      } else {
        setError(null);
        setRows(result.data);
      }
      setLoading(false);
    }
    if (sessionStatus === 'error') {
      setLoading(false);
      return;
    }
    if (sessionStatus === 'ready') void load();
    return () => {
      cancelled = true;
    };
  }, [allowed, sessionStatus]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (status && row.status !== status) return false;
      if (!q) return true;
      const label = copy.docTypes[row.doc_type as keyof typeof copy.docTypes] ?? row.doc_type;
      return (
        label.toLowerCase().includes(q) ||
        row.user_id.toLowerCase().includes(q) ||
        (row.notes ?? '').toLowerCase().includes(q) ||
        row.doc_type.toLowerCase().includes(q)
      );
    });
  }, [copy.docTypes, query, rows, status]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
    return [...counts.entries()];
  }, [rows]);

  async function onReview(documentId: string, status: 'accepted' | 'rejected' | 'under_review') {
    setBusyId(documentId);
    setMessage(null);
    setError(null);
    const result = await reviewTrustDocument({
      documentId,
      status,
      rejectionReason: status === 'rejected' ? (reasons[documentId] ?? '') : null,
    });
    setBusyId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(copy.reviewed);
    await reload();
  }

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-8">
        <header className="kuteka-glass flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Heading level={1}>{copy.reviewTitle}</Heading>
            <Text className="text-slate-600">{copy.reviewHint}</Text>
          </div>
          {allowed ? (
            <Link
              href="/app/admin"
              className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
            >
              Painel de administração
            </Link>
          ) : null}
        </header>

        {accessPending ? <SoftListSlot pending /> : null}
        {denied ? (
          <ForbiddenPanel
            message={copy.reviewForbidden}
            primaryHref="/app"
            primaryLabel="Ir ao painel"
          />
        ) : null}

        {allowed ? (
          <SoftListSlot pending={loading && rows.length === 0}>
            {message ? (
              <div className="rounded-kuteka border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                {message}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {error}
              </div>
            ) : null}

            {!loading && rows.length === 0 ? (
              <EmptyState title={copy.emptyReviewTitle} description={copy.emptyReview} />
            ) : null}

            {rows.length > 0 ? (
              <div className="flex flex-col gap-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Procurar tipo, nota ou identificador"
                  aria-label="Procurar documento de confiança"
                  className="kuteka-ops-input w-full"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('')}
                    className={cn(
                      'rounded-kuteka border px-3 py-1.5 text-xs font-semibold',
                      status === ''
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 bg-white text-slate-700',
                    )}
                  >
                    Todos · {rows.length}
                  </button>
                  {statusCounts.map(([code, count]) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setStatus(code)}
                      className={cn(
                        'rounded-kuteka border px-3 py-1.5 text-xs font-semibold',
                        status === code
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 bg-white text-slate-700',
                      )}
                    >
                      {copy.statuses[code as keyof typeof copy.statuses] ?? code} · {count}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {rows.length > 0 && shown.length === 0 ? (
              <EmptyState title="Nenhum documento neste filtro" description="Mude a pesquisa ou o estado." />
            ) : null}

            {shown.length > 0 ? (
              <ul className="flex flex-col gap-4">
                {shown.map((row) => {
                  const busy = busyId === row.id;
                  return (
                    <li
                      key={row.id}
                      className="flex flex-col gap-3 rounded-kuteka border border-slate-200 bg-white px-4 py-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-800">
                            {copy.docTypes[row.doc_type as keyof typeof copy.docTypes] ??
                              row.doc_type}
                          </p>
                          <p className="text-sm text-slate-500">
                            Utilizador:{' '}
                            <span className="font-mono text-xs">{row.user_id.slice(0, 8)}…</span>
                          </p>
                          <p className="text-sm text-slate-500">
                            {copy.fields.createdAt}:{' '}
                            {new Date(row.created_at).toLocaleString('pt-PT')}
                          </p>
                          {row.notes ? (
                            <p className="mt-2 text-sm text-slate-700">{row.notes}</p>
                          ) : null}
                        </div>
                        <Badge variant="brand" className="w-fit">
                          {copy.statuses[row.status as keyof typeof copy.statuses] ?? row.status}
                        </Badge>
                      </div>

                      <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium text-slate-800">
                          {copy.rejectionReasonLabel}
                        </span>
                        <input
                          type="text"
                          value={reasons[row.id] ?? ''}
                          onChange={(e) =>
                            setReasons((prev) => ({ ...prev, [row.id]: e.target.value }))
                          }
                          placeholder={copy.rejectionReasonPlaceholder}
                          className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-slate-900"
                          disabled={busy}
                        />
                      </label>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          disabled={busy}
                          onClick={() => void onReview(row.id, 'accepted')}
                        >
                          {busy ? copy.reviewing : copy.accept}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => void onReview(row.id, 'under_review')}
                        >
                          {copy.markReview}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => void onReview(row.id, 'rejected')}
                        >
                          {copy.reject}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </SoftListSlot>
        ) : null}
      </div>
    </SessionStatusGate>
  );
}
