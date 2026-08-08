'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Checkbox, Label, Text, Textarea, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { MessagePropertyOwnerButton } from '@/modules/mensagens/components/MessagePropertyOwnerButton';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getAdministracaoCopy } from '../content';
import {
  assignPublicationReview,
  decidePublication,
  listPendingReasons,
  listQueue,
  type PendingReason,
  type PublicationDecision,
  type PublicationQueueItem,
} from '../services/publication-review-client';

const REASONS_REQUIRED: PublicationDecision[] = [
  'pending',
  'reject',
  'request_corrections',
  'request_documents',
  'request_technical_visit',
];

type WorkBucket =
  'all' | 'in_review' | 'pending' | 'sla_soon' | 'sla_overdue' | 'waiting_pp' | 'waiting_agent';

type ItemDraft = {
  reasons: string[];
  notes: string;
};

function emptyDraft(): ItemDraft {
  return { reasons: [], notes: '' };
}

function hoursWaiting(createdAt: string): number {
  const ms = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60)));
}

function bucketOf(item: PublicationQueueItem): WorkBucket[] {
  const buckets: WorkBucket[] = [];
  const status = item.review_status;
  if (status === 'in_review') buckets.push('in_review');
  if (
    status === 'pending' ||
    status === 'corrections_requested' ||
    status === 'documents_requested'
  ) {
    buckets.push('pending');
    buckets.push('waiting_pp');
  }
  if (status === 'technical_visit_requested') buckets.push('waiting_agent');
  if (item.sla_deadline_at) {
    const deadline = new Date(item.sla_deadline_at).getTime();
    const now = Date.now();
    if (deadline < now) buckets.push('sla_overdue');
    else if (deadline - now < 12 * 60 * 60 * 1000) buckets.push('sla_soon');
  }
  if (item.escalated_at) buckets.push('sla_overdue');
  return buckets;
}

function nextActionHint(
  item: PublicationQueueItem,
  copy: ReturnType<typeof getAdministracaoCopy>,
): string {
  switch (item.review_status) {
    case 'in_review':
      return copy.approve;
    case 'pending':
    case 'corrections_requested':
    case 'documents_requested':
      return copy.workBucketWaitingPp;
    case 'technical_visit_requested':
      return copy.workBucketWaitingAgent;
    default:
      return item.review_status;
  }
}

export function PublicationReviewQueue() {
  const { locale } = useLocale();
  const copy = getAdministracaoCopy(locale);
  const { session } = useAppSession();
  const roles = session?.roles ?? [];
  const canApproveReject = roles.some((r) =>
    ['administrator', 'super_administrator', 'founder', 'co_founder'].includes(r),
  );
  const isFounder = roles.some((r) => ['founder', 'co_founder'].includes(r));
  const isSuper = roles.includes('super_administrator');
  const isAdmin = roles.includes('administrator');
  const isSupervisor = roles.includes('supervisor');

  const [items, setItems] = useState<PublicationQueueItem[]>([]);
  const [catalog, setCatalog] = useState<PendingReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ItemDraft>>({});
  const [bucket, setBucket] = useState<WorkBucket>('all');

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

  const filtered = useMemo(() => {
    if (bucket === 'all') return items;
    return items.filter((item) => bucketOf(item).includes(bucket));
  }, [items, bucket]);

  const bucketCounts = useMemo(() => {
    const counts: Record<WorkBucket, number> = {
      all: items.length,
      in_review: 0,
      pending: 0,
      sla_soon: 0,
      sla_overdue: 0,
      waiting_pp: 0,
      waiting_agent: 0,
    };
    for (const item of items) {
      for (const b of bucketOf(item)) counts[b] += 1;
    }
    return counts;
  }, [items]);

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
    if (REASONS_REQUIRED.includes(decision) && draft.reasons.length === 0 && !draft.notes.trim()) {
      setError(copy.decideError);
      setMessage(null);
      return;
    }
    if ((decision === 'approve' || decision === 'reject') && !canApproveReject) {
      setError(copy.supervisorCannotApprove);
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

  async function onAssign(item: PublicationQueueItem) {
    setBusyId(item.review_id);
    setError(null);
    setMessage(null);
    const result = await assignPublicationReview(item.review_id);
    setBusyId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(copy.assignOk);
    await reload();
  }

  const buckets: { key: WorkBucket; label: string }[] = [
    { key: 'all', label: copy.workBucketAll },
    { key: 'in_review', label: copy.workBucketInReview },
    { key: 'pending', label: copy.workBucketPending },
    { key: 'sla_soon', label: copy.workBucketSlaSoon },
    { key: 'sla_overdue', label: copy.workBucketSlaOverdue },
    { key: 'waiting_pp', label: copy.workBucketWaitingPp },
    { key: 'waiting_agent', label: copy.workBucketWaitingAgent },
  ];

  const roleHint = isFounder
    ? copy.rolePowerFounder
    : isSuper
      ? copy.rolePowerSuper
      : isAdmin
        ? copy.rolePowerAdmin
        : isSupervisor
          ? copy.rolePowerSupervisor
          : canApproveReject
            ? copy.rolePowerAdmin
            : copy.rolePowerSupervisor;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="publication-queue-heading">
      <div className="flex flex-col gap-1">
        <h2 id="publication-queue-heading" className="text-sm font-semibold text-slate-800">
          {copy.publicationQueueTitle}
        </h2>
        <Text className="text-sm text-slate-500">{copy.publicationQueueHint}</Text>
      </div>

      <div className="rounded-kuteka border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        <p className="font-semibold">{copy.rolePowerTitle}</p>
        <p className="mt-1">{roleHint}</p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={copy.publicationQueueTitle}>
        {buckets.map((b) => (
          <button
            key={b.key}
            type="button"
            role="tab"
            aria-selected={bucket === b.key}
            onClick={() => setBucket(b.key)}
            className={cn(
              'rounded-kuteka border px-3 py-1.5 text-xs font-semibold',
              bucket === b.key
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-700',
            )}
          >
            {b.label} · {bucketCounts[b.key]}
          </button>
        ))}
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

        {!loading && filtered.length === 0 ? (
          <EmptyState title={copy.publicationQueueTitle} description={copy.emptyQueue} />
        ) : null}

        {filtered.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {filtered.map((item) => {
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
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                        <span>
                          {copy.partnerLabel}:{' '}
                          <strong className="text-slate-800">
                            {item.owner_name || item.owner_email || item.owner_id.slice(0, 8)}
                          </strong>
                        </span>
                        <span>
                          {copy.waitingLabel}:{' '}
                          <strong className="text-slate-800">
                            {hoursWaiting(item.created_at)}h
                          </strong>
                        </span>
                        <span>
                          {copy.assigneeLabel}:{' '}
                          <strong className="text-slate-800">
                            {item.assigned_name || item.assigned_to?.slice(0, 8) || '—'}
                          </strong>
                        </span>
                        <span>
                          {copy.nextActionLabel}:{' '}
                          <strong className="text-slate-800">{nextActionHint(item, copy)}</strong>
                        </span>
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
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => void onAssign(item)}
                      >
                        {busy ? copy.assignBusy : copy.assignToMe}
                      </Button>
                    </div>
                  </div>

                  {item.owner_id ? (
                    <MessagePropertyOwnerButton
                      propertyId={item.property_id}
                      ownerId={item.owner_id}
                      propertyTitle={item.title}
                      label={copy.contactPartner}
                    />
                  ) : null}

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
                    <Label htmlFor={`notes-${item.review_id}`}>{copy.notesRequired}</Label>
                    <Textarea
                      id={`notes-${item.review_id}`}
                      value={draft.notes}
                      disabled={busy}
                      rows={2}
                      onChange={(e) => updateDraft(item.review_id, { notes: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {canApproveReject ? (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        disabled={busy}
                        onClick={() => void onDecide(item, 'approve')}
                      >
                        {busy ? copy.decideBusy : copy.approve}
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void onDecide(item, 'pending')}
                    >
                      {copy.pending}
                    </Button>
                    {canApproveReject ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={busy}
                        onClick={() => void onDecide(item, 'reject')}
                      >
                        {copy.reject}
                      </Button>
                    ) : null}
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
                  {!canApproveReject ? (
                    <p className="text-xs text-slate-600">{copy.supervisorScopeHint}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </SoftListSlot>
    </section>
  );
}
