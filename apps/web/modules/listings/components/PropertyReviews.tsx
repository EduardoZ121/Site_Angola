'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { LOCALE_INTL_TAG } from '@/modules/i18n/types';
import { getListingsCopy, type ListingsCopy } from '../content';
import type { ContractReviewRow } from '../types';

function Stars({ rating, ariaTemplate }: { rating: number; ariaTemplate: string }) {
  const n = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span
      className="kuteka-detail-stars inline-flex gap-0.5"
      aria-label={ariaTemplate.replace('{n}', String(n))}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? 'text-[#f0a91f]' : 'text-slate-300'} aria-hidden>
          ★
        </span>
      ))}
    </span>
  );
}

type EligibleContract = {
  id: string;
  code: string;
  status: string;
};

const SELECT_FULL =
  'id, contract_id, property_id, reviewer_id, subject_kind, subject_user_id, rating, comment, dimensions, created_at, owner_reply, owner_replied_at, agent_reply, agent_replied_at';
const SELECT_CORE =
  'id, contract_id, property_id, reviewer_id, subject_kind, subject_user_id, rating, comment, dimensions, created_at';

/**
 * Reputação Airbnb-style — estrelas, média, histórico e respostas.
 */
export function PropertyReviews({ propertyId }: { propertyId: string }) {
  const { locale } = useLocale();
  const copy = getListingsCopy(locale);
  const reviewsCopy = copy.reviews;
  const subjectLabels = copy.subjects as ListingsCopy['subjects'] & Record<string, string>;
  const { session, status: sessionStatus } = useAppSession();
  const canWrite =
    sessionStatus === 'ready' && !!session?.permissions.includes('reputation.manage');
  const canReplyOwner = session?.permissions.includes('properties.manage') ?? false;
  const canReplyAgent = session?.permissions.includes('agent.operate') ?? false;

  const [rows, setRows] = useState<ContractReviewRow[]>([]);
  const [contracts, setContracts] = useState<EligibleContract[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [contractId, setContractId] = useState('');
  const [subjectKind, setSubjectKind] = useState('property');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formOk, setFormOk] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  async function fetchReviews() {
    const client = createBrowserClient();
    const full = await client
      .from('contract_reviews')
      .select(SELECT_FULL)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(40);
    if (!full.error) {
      setRows((full.data as ContractReviewRow[]) ?? []);
      return;
    }
    const core = await client
      .from('contract_reviews')
      .select(SELECT_CORE)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(40);
    setRows((core.data as ContractReviewRow[]) ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        await fetchReviews();
        if (canWrite) {
          const client = createBrowserClient();
          const { data: userData } = await client.auth.getUser();
          const uid = userData.user?.id;
          if (uid) {
            const { data: contractsData } = await client
              .from('property_contracts')
              .select('id, code, status')
              .eq('property_id', propertyId)
              .eq('status', 'completed')
              .is('deleted_at', null)
              .or(`client_id.eq.${uid},partner_id.eq.${uid},agent_id.eq.${uid}`)
              .limit(12);
            if (!cancelled) {
              const list = (contractsData as EligibleContract[]) ?? [];
              setContracts(list);
              if (list[0]) setContractId(list[0].id);
            }
          }
        }
        if (!cancelled) setLoaded(true);
      } catch {
        if (!cancelled) {
          setRows([]);
          setLoaded(true);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, canWrite]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormOk(null);
    if (!contractId) {
      setFormError(reviewsCopy.needContractError);
      return;
    }
    setSubmitting(true);
    try {
      const client = createBrowserClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) {
        setFormError(reviewsCopy.invalidSessionError);
        setSubmitting(false);
        return;
      }
      const { error } = await client.from('contract_reviews').insert({
        contract_id: contractId,
        property_id: propertyId,
        reviewer_id: user.id,
        subject_kind: subjectKind,
        rating,
        comment: comment.trim() || null,
        dimensions: {},
      });
      if (error) {
        setFormError(
          error.message.includes('duplicate') || error.code === '23505'
            ? reviewsCopy.duplicateError
            : reviewsCopy.saveError,
        );
      } else {
        setFormOk(reviewsCopy.saveSuccess);
        setComment('');
        await fetchReviews();
      }
    } catch {
      setFormError(reviewsCopy.saveError);
    }
    setSubmitting(false);
  }

  async function submitReply(reviewId: string, kind: 'owner' | 'agent') {
    const text = replyDrafts[reviewId]?.trim();
    if (!text) return;
    const client = createBrowserClient();
    const patch =
      kind === 'owner'
        ? { owner_reply: text, owner_replied_at: new Date().toISOString() }
        : { agent_reply: text, agent_replied_at: new Date().toISOString() };
    const { error } = await client.from('contract_reviews').update(patch).eq('id', reviewId);
    if (!error) {
      setReplyDrafts((prev) => ({ ...prev, [reviewId]: '' }));
      await fetchReviews();
    }
  }

  const avg =
    rows.length > 0 ? rows.reduce((sum, row) => sum + Number(row.rating), 0) / rows.length : null;

  const bySubject = Object.keys(subjectLabels).map((key) => {
    const subset = rows.filter((r) => r.subject_kind === key);
    const mean =
      subset.length > 0 ? subset.reduce((s, r) => s + Number(r.rating), 0) / subset.length : null;
    return { key, label: subjectLabels[key], mean, count: subset.length };
  });

  return (
    <section
      id="avaliacoes"
      className="kuteka-detail-panel p-5 sm:p-6"
      aria-labelledby="reviews-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="reviews-heading" className="kuteka-detail-title">
            {reviewsCopy.title}
          </h2>
          <p className="kuteka-detail-meta mt-1">{reviewsCopy.subtitle}</p>
        </div>
        {avg != null ? (
          <div className="text-right">
            <Stars rating={avg} ariaTemplate={reviewsCopy.starsAriaTemplate} />
            <p className="kuteka-detail-meta mt-1">
              {reviewsCopy.averageTemplate
                .replace('{avg}', avg.toFixed(1))
                .replace('{count}', String(rows.length))}
            </p>
          </div>
        ) : null}
      </div>

      {bySubject.some((s) => s.count > 0) ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {bySubject
            .filter((s) => s.count > 0)
            .map((s) => (
              <li
                key={s.key}
                className="kuteka-detail-review flex items-center justify-between gap-2"
              >
                <span className="text-sm font-medium text-slate-800">{s.label}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Stars rating={s.mean ?? 0} ariaTemplate={reviewsCopy.starsAriaTemplate} />
                  <span className="font-mono text-xs text-slate-600">{s.mean?.toFixed(1)}</span>
                </span>
              </li>
            ))}
        </ul>
      ) : null}

      {canWrite ? (
        <form
          onSubmit={onSubmit}
          className="mt-5 flex flex-col gap-3 border-t border-[var(--kuteka-detail-line)] pt-5"
        >
          <h3 className="kuteka-detail-subtitle">{reviewsCopy.writeTitle}</h3>
          {contracts.length === 0 ? (
            <p className="kuteka-detail-body">{reviewsCopy.unavailable}</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="kuteka-detail-label">{reviewsCopy.contractLabel}</span>
                  <select
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                    className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    {contracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="kuteka-detail-label">{reviewsCopy.subjectLabel}</span>
                  <select
                    value={subjectKind}
                    onChange={(e) => setSubjectKind(e.target.value)}
                    className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  >
                    {Object.entries(subjectLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm">
                <span className="kuteka-detail-label">{reviewsCopy.ratingLabel}</span>
                <div className="flex flex-wrap items-center gap-2">
                  {[5, 4, 3, 2, 1].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className={
                        rating === n
                          ? 'kuteka-detail-chip kuteka-detail-chip--accent'
                          : 'kuteka-detail-chip'
                      }
                    >
                      {n} ★
                    </button>
                  ))}
                </div>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="kuteka-detail-label">{reviewsCopy.commentLabel}</span>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  placeholder={reviewsCopy.commentPlaceholder}
                />
              </label>
              {formError ? (
                <p className="text-sm text-amber-900" role="alert">
                  {formError}
                </p>
              ) : null}
              {formOk ? <p className="text-sm text-emerald-800">{formOk}</p> : null}
              <button
                type="submit"
                disabled={submitting}
                className="kuteka-detail-chip kuteka-detail-chip--accent w-fit px-4 py-2"
              >
                {submitting ? reviewsCopy.submitting : reviewsCopy.submit}
              </button>
            </>
          )}
        </form>
      ) : null}

      {!loaded ? <p className="kuteka-detail-meta mt-4">{reviewsCopy.loading}</p> : null}

      {loaded && rows.length === 0 ? (
        <p className="kuteka-detail-body mt-4">{reviewsCopy.empty}</p>
      ) : null}

      {rows.length > 0 ? (
        <ul className="mt-5 flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.id} className="kuteka-detail-review">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="kuteka-detail-chip kuteka-detail-chip--accent">
                  {subjectLabels[row.subject_kind] ?? row.subject_kind}
                </span>
                <Stars rating={Number(row.rating)} ariaTemplate={reviewsCopy.starsAriaTemplate} />
              </div>
              <p className="kuteka-detail-meta mt-1">
                {new Date(row.created_at).toLocaleDateString(LOCALE_INTL_TAG[locale])}
              </p>
              {row.comment ? <p className="kuteka-detail-body mt-2">{row.comment}</p> : null}

              {row.owner_reply ? (
                <div className="mt-3 rounded-kuteka border-l-4 border-[#08263f] bg-slate-50 px-3 py-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#08263f]">
                    {reviewsCopy.ownerReply}
                  </p>
                  <p className="kuteka-detail-body mt-1">{row.owner_reply}</p>
                </div>
              ) : null}
              {row.agent_reply ? (
                <div className="mt-2 rounded-kuteka border-l-4 border-[#f0a91f] bg-amber-50/60 px-3 py-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#08263f]">
                    {reviewsCopy.agentReply}
                  </p>
                  <p className="kuteka-detail-body mt-1">{row.agent_reply}</p>
                </div>
              ) : null}

              {(canReplyOwner && !row.owner_reply) || (canReplyAgent && !row.agent_reply) ? (
                <div className="mt-3 flex flex-col gap-2">
                  <textarea
                    value={replyDrafts[row.id] ?? ''}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                    }
                    rows={2}
                    className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                    placeholder={reviewsCopy.replyPlaceholder}
                  />
                  <div className="flex flex-wrap gap-2">
                    {canReplyOwner && !row.owner_reply ? (
                      <button
                        type="button"
                        className="kuteka-detail-chip kuteka-detail-chip--accent"
                        onClick={() => void submitReply(row.id, 'owner')}
                      >
                        {reviewsCopy.replyAsOwner}
                      </button>
                    ) : null}
                    {canReplyAgent && !row.agent_reply ? (
                      <button
                        type="button"
                        className="kuteka-detail-chip kuteka-detail-chip--accent"
                        onClick={() => void submitReply(row.id, 'agent')}
                      >
                        {reviewsCopy.replyAsAgent}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
