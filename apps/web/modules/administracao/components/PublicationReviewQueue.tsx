'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Button, Checkbox, Label, Text, Textarea, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getAdministracaoCopy } from '../content';
import {
  decidePublication,
  listPendingReasons,
  listQueue,
  type PendingReason,
  type PublicationDecision,
  type PublicationQueueItem,
} from '../services/publication-review-client';

const REASONS_REQUIRED: PublicationDecision[] = [
  'pending',
  'request_corrections',
  'request_documents',
];

type ItemDraft = {
  reasons: string[];
  notes: string;
};

function emptyDraft(): ItemDraft {
  return { reasons: [], notes: '' };
}

export function PublicationReviewQueue() {
  const { locale } = useLocale();
  const copy = getAdministracaoCopy(locale);

  const [items, setItems] = useState<PublicationQueueItem[]>([]);
  const [catalog, setCatalog] = useState<PendingReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});

  async function reload() {
    const [queueResult, reasonsResult] = await Promise.all([listQueue(), listPendingReasons()]);
    if (!queueResult.ok) {
      setError(queueResult.message);
      setItems([]);
      return;
    }
    setError(null);
    setItems(queueResult.data);
    if (reasonsResult.ok) setCatalog(reasonsResult.data);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [queueResult, reasonsResult] = await Promise.all([listQueue(), listPendingReasons()]);
      if (cancelled) return;
      if (!queueResult.ok) {
        setError(queueResult.message);
        setItems([]);
      } else {
        setError(null);
        setItems(queueResult.data);
      }
      if (reasonsResult.ok) setCatalog(reasonsResult.data);
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function draftFor(id: string): ItemDraft {
    return drafts[id] ?? emptyDraft();
  }

  function updateDraft(id: string, patch: Partial<ItemDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...emptyDraft(), ...prev[id], ...patch },
    }));
  }

  function toggleReason(id: string, code: string) {
    const current = draftFor(id).reasons;
    const next = current.includes(code) ? current.filter((c) => c !== code) : [...current, code];
    updateDraft(id, { reasons: next });
  }

  async function onDecide(item: PublicationQueueItem, decision: PublicationDecision) {
    const draft = draftFor(item.review_id);
    if (REASONS_REQUIRED.includes(decision) && draft.reasons.length === 0) {
      setError(copy.decideError);
      setMessage(null);
      return;
    }

    setBusyId(item.review_id);
    setError(null);
    setMessage(null);
    const result = await decidePublication({
      propertyId: item.property_id,
      decision,
      pendingReasonCodes: draft.reasons,
      adminNotes: draft.notes || null,
    });
    setBusyId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(copy.decideOk);
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[item.review_id];
      return next;
    });
    await reload();
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="publication-queue-heading">
      <div className="flex flex-col gap-1">
        <h2 id="publication-queue-heading" className="text-sm font-semibold text-slate-800">
          {copy.publicationQueueTitle}
        </h2>
        <Text className="text-sm text-slate-500">{copy.publicationQueueHint}</Text>
      </div>

      <SoftListSlot pending={loading && items.length === 0}>
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

        {!loading && items.length === 0 ? (
          <EmptyState title={copy.publicationQueueTitle} description={copy.emptyQueue} />
        ) : null}

        {items.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {items.map((item) => {
              const busy = busyId === item.review_id;
              const draft = draftFor(item.review_id);
              const kai = item.kai_preliminary;
              const score = kai?.score;
              const issues = kai?.issues ?? [];

              return (
                <li
                  key={item.review_id}
                  className="flex flex-col gap-3 rounded-kuteka border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-slate-900">{item.title ?? item.property_id}</p>
                      <p className="text-sm text-slate-500">
                        {[item.property_code, item.city, item.province].filter(Boolean).join(' · ')}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                        {score != null ? (
                          <span>
                            {copy.kaiScore}: <strong className="text-slate-800">{score}</strong>
                          </span>
                        ) : null}
                        {item.sla_deadline_at ? (
                          <span>
                            {copy.slaDeadline}:{' '}
                            {new Date(item.sla_deadline_at).toLocaleString(
                              locale === 'en' ? 'en-GB' : `${locale}-PT`,
                            )}
                          </span>
                        ) : null}
                      </div>
                      {issues.length > 0 ? (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {issues.map((issue) => (
                            <li key={issue}>
                              <Badge variant="warning" className="font-normal">
                                {issue}
                              </Badge>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="brand" className="w-fit">
                        {item.review_status}
                      </Badge>
                      <Link
                        href={`/app/habitacao/detalhe?id=${encodeURIComponent(item.property_id)}`}
                        className={cn(
                          buttonVariants({ variant: 'secondary', size: 'sm' }),
                          'w-fit',
                        )}
                      >
                        {copy.openProperty}
                      </Link>
                    </div>
                  </div>

                  {catalog.length > 0 ? (
                    <fieldset className="flex flex-col gap-2">
                      <legend className="text-sm font-medium text-slate-800">{copy.reasons}</legend>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {catalog.map((reason) => {
                          const checked = draft.reasons.includes(reason.code);
                          const id = `${item.review_id}-${reason.code}`;
                          return (
                            <li key={reason.code}>
                              <label
                                htmlFor={id}
                                className="flex cursor-pointer items-start gap-2 rounded-kuteka border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                              >
                                <Checkbox
                                  id={id}
                                  checked={checked}
                                  disabled={busy}
                                  onChange={() => toggleReason(item.review_id, reason.code)}
                                  className="mt-0.5 shrink-0"
                                />
                                <span className="flex flex-col gap-0.5">
                                  <span className="font-medium text-slate-800">
                                    {reason.label_pt}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {reason.solution_pt}
                                  </span>
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </fieldset>
                  ) : null}

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`notes-${item.review_id}`}>{copy.notes}</Label>
                    <Textarea
                      id={`notes-${item.review_id}`}
                      value={draft.notes}
                      disabled={busy}
                      rows={2}
                      onChange={(e) => updateDraft(item.review_id, { notes: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void onDecide(item, 'approve')}
                    >
                      {busy ? copy.decideBusy : copy.approve}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void onDecide(item, 'pending')}
                    >
                      {copy.pending}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void onDecide(item, 'reject')}
                    >
                      {copy.reject}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void onDecide(item, 'request_corrections')}
                    >
                      {copy.requestCorrections}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void onDecide(item, 'request_technical_visit')}
                    >
                      {copy.requestVisit}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void onDecide(item, 'request_documents')}
                    >
                      {copy.requestDocs}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </SoftListSlot>
    </section>
  );
}
