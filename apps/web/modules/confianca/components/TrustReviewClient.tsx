'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Button, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { ModuleSkeleton } from '@/modules/shell/components/ModuleSkeleton';
import { getConfiancaCopy } from '../content/pt';
import {
  listPendingTrustDocuments,
  reviewTrustDocument,
  type TrustDocumentRow,
} from '../services/trust-client';

export function TrustReviewClient() {
  const copy = getConfiancaCopy();
  const { session, status: sessionStatus } = useAppSession();
  const allowed = sessionStatus === 'ready' && !!session?.permissions.includes('admin.panel');

  const [rows, setRows] = useState<TrustDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

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
    if (sessionStatus === 'ready') void load();
    return () => {
      cancelled = true;
    };
  }, [allowed, sessionStatus]);

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

  if (sessionStatus === 'loading') return <ModuleSkeleton rows={3} />;

  if (!allowed) {
    return (
      <div className="flex flex-col gap-4">
        <Heading level={1}>{copy.reviewTitle}</Heading>
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {copy.reviewForbidden}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            Operação
          </p>
          <Heading level={1}>{copy.reviewTitle}</Heading>
          <Text className="text-slate-600">{copy.reviewHint}</Text>
        </div>
        <Link
          href="/app/confianca"
          className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
        >
          {copy.backToHub}
        </Link>
      </header>

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

      {loading ? <ModuleSkeleton rows={4} /> : null}

      {!loading && rows.length === 0 ? (
        <EmptyState title={copy.emptyReviewTitle} description={copy.emptyReview} />
      ) : null}

      {!loading && rows.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {rows.map((row) => {
            const busy = busyId === row.id;
            return (
              <li
                key={row.id}
                className="flex flex-col gap-3 rounded-kuteka border border-slate-200 bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-800">
                      {copy.docTypes[row.doc_type as keyof typeof copy.docTypes] ?? row.doc_type}
                    </p>
                    <p className="text-sm text-slate-500">
                      Utilizador:{' '}
                      <span className="font-mono text-xs">{row.user_id.slice(0, 8)}…</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      {copy.fields.createdAt}: {new Date(row.created_at).toLocaleString('pt-PT')}
                    </p>
                    {row.notes ? <p className="mt-2 text-sm text-slate-700">{row.notes}</p> : null}
                  </div>
                  <Badge variant="brand" className="w-fit">
                    {copy.statuses[row.status as keyof typeof copy.statuses] ?? row.status}
                  </Badge>
                </div>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium text-slate-800">{copy.rejectionReasonLabel}</span>
                  <input
                    type="text"
                    value={reasons[row.id] ?? ''}
                    onChange={(e) => setReasons((prev) => ({ ...prev, [row.id]: e.target.value }))}
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
    </div>
  );
}
