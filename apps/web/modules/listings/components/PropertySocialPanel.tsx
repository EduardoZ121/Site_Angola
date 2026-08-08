'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { LOCALE_INTL_TAG } from '@/modules/i18n/types';
import { getListingsCopy } from '../content';

type SocialSummary = {
  likes: number;
  favorites: number;
  comments: number;
  questions: number;
  likedByMe: boolean;
  favoritedByMe: boolean;
};

type SocialPost = {
  id: string;
  property_id: string;
  author_id: string;
  kind: 'comment' | 'question' | 'answer';
  parent_id: string | null;
  body: string;
  author_role: string | null;
  is_official: boolean;
  moderation_status: string;
  created_at: string;
  author_name: string | null;
};

type PanelKey = 'comments' | 'ask' | 'share' | null;

const EMPTY_SUMMARY: SocialSummary = {
  likes: 0,
  favorites: 0,
  comments: 0,
  questions: 0,
  likedByMe: false,
  favoritedByMe: false,
};

function parseSummary(raw: unknown): SocialSummary {
  if (!raw || typeof raw !== 'object') return EMPTY_SUMMARY;
  const o = raw as Record<string, unknown>;
  return {
    likes: Number(o.likes ?? 0),
    favorites: Number(o.favorites ?? 0),
    comments: Number(o.comments ?? 0),
    questions: Number(o.questions ?? 0),
    likedByMe: Boolean(o.likedByMe),
    favoritedByMe: Boolean(o.favoritedByMe),
  };
}

function parsePosts(raw: unknown): SocialPost[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const o = row as Record<string, unknown>;
    return {
      id: String(o.id),
      property_id: String(o.property_id),
      author_id: String(o.author_id),
      kind: o.kind as SocialPost['kind'],
      parent_id: o.parent_id ? String(o.parent_id) : null,
      body: String(o.body ?? ''),
      author_role: o.author_role != null ? String(o.author_role) : null,
      is_official: Boolean(o.is_official),
      moderation_status: String(o.moderation_status ?? 'visible'),
      created_at: String(o.created_at),
      author_name: o.author_name != null ? String(o.author_name) : null,
    };
  });
}

function officialLabel(
  role: string | null,
  copy: ReturnType<typeof getListingsCopy>['social'],
): string | null {
  if (role === 'partner') return copy.officialPartner;
  if (role === 'agent') return copy.officialAgent;
  if (role === 'kuteka') return copy.officialKuteka;
  return null;
}

function actionChipClass(active: boolean, accent?: boolean): string {
  return [
    'inline-flex min-h-11 items-center gap-1.5 rounded-kuteka border px-3 py-2 text-sm font-semibold transition',
    active
      ? accent
        ? 'border-sky-600 bg-sky-600 text-white'
        : 'border-slate-900 bg-slate-900 text-white'
      : 'border-slate-300 bg-white text-slate-800 hover:border-slate-500 hover:bg-slate-50',
  ].join(' ');
}

/**
 * Social action bar — immediately under the photo gallery.
 * Expandable chips (not separate pages): Like · Favorite · Comments · Ask · Share.
 */
export function PropertySocialPanel({
  propertyId,
  propertyTitle,
}: {
  propertyId: string;
  propertyTitle?: string | null;
}) {
  const { locale } = useLocale();
  const copy = getListingsCopy(locale).social;
  const dateLocale = LOCALE_INTL_TAG[locale];
  const { session, status: sessionStatus } = useAppSession();
  const signedIn = sessionStatus === 'ready' && !!session;

  const [summary, setSummary] = useState<SocialSummary>(EMPTY_SUMMARY);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<PanelKey>(null);
  const [body, setBody] = useState('');
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  }, []);

  const refresh = useCallback(async () => {
    const client = createBrowserClient();
    const [sumRes, listRes] = await Promise.all([
      client.rpc('property_social_summary', { p_property_id: propertyId }),
      client.rpc('list_property_social_posts', { p_property_id: propertyId }),
    ]);
    if (!sumRes.error) setSummary(parseSummary(sumRes.data));
    if (!listRes.error) setPosts(parsePosts(listRes.data));
  }, [propertyId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        await refresh();
      } catch {
        /* soft fail */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const comments = useMemo(() => posts.filter((p) => p.kind === 'comment'), [posts]);
  const questions = useMemo(() => posts.filter((p) => p.kind === 'question'), [posts]);
  const answersByParent = useMemo(() => {
    const map: Record<string, SocialPost[]> = {};
    for (const p of posts) {
      if (p.kind !== 'answer' || !p.parent_id) continue;
      (map[p.parent_id] ??= []).push(p);
    }
    return map;
  }, [posts]);

  function togglePanel(key: Exclude<PanelKey, null>) {
    setOpen((prev) => (prev === key ? null : key));
    setErr(null);
    setMsg(null);
  }

  async function onToggleLike() {
    if (!signedIn) {
      setErr(copy.signInHint);
      return;
    }
    setBusy(true);
    setErr(null);
    const client = createBrowserClient();
    const { data, error } = await client.rpc('toggle_property_like', {
      p_property_id: propertyId,
    });
    setBusy(false);
    if (error) {
      setErr(copy.saveError);
      return;
    }
    setSummary(parseSummary(data));
  }

  async function onToggleFavorite() {
    if (!signedIn) {
      setErr(copy.signInHint);
      return;
    }
    setBusy(true);
    setErr(null);
    const client = createBrowserClient();
    const { data, error } = await client.rpc('toggle_property_favorite', {
      p_property_id: propertyId,
    });
    setBusy(false);
    if (error) {
      setErr(copy.saveError);
      return;
    }
    setSummary(parseSummary(data));
  }

  async function onSubmitPost(kind: 'comment' | 'question', event: FormEvent) {
    event.preventDefault();
    if (!signedIn || !body.trim()) return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    const client = createBrowserClient();
    const { error } = await client.rpc('create_property_social_post', {
      p_property_id: propertyId,
      p_kind: kind,
      p_body: body.trim(),
      p_parent_id: null,
    });
    setBusy(false);
    if (error) {
      setErr(copy.saveError);
      return;
    }
    setBody('');
    setMsg(copy.postOk);
    await refresh();
  }

  async function onSubmitAnswer(parentId: string) {
    if (!signedIn) return;
    const text = (answerDrafts[parentId] ?? '').trim();
    if (!text) return;
    setBusy(true);
    setErr(null);
    const client = createBrowserClient();
    const { error } = await client.rpc('create_property_social_post', {
      p_property_id: propertyId,
      p_kind: 'answer',
      p_body: text,
      p_parent_id: parentId,
    });
    setBusy(false);
    if (error) {
      setErr(copy.saveError);
      return;
    }
    setAnswerDrafts((prev) => ({ ...prev, [parentId]: '' }));
    setMsg(copy.postOk);
    await refresh();
  }

  async function onReport(postId: string, reason: 'spam' | 'offensive') {
    if (!signedIn) return;
    setBusy(true);
    setErr(null);
    const client = createBrowserClient();
    const { error } = await client.rpc('report_property_social_post', {
      p_post_id: postId,
      p_reason_code: reason,
      p_details: null,
    });
    setBusy(false);
    if (error) {
      setErr(copy.saveError);
      return;
    }
    setMsg(copy.reportOk);
  }

  async function onCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl || window.location.href);
      setMsg(copy.shareCopied);
    } catch {
      setErr(copy.shareError);
    }
  }

  function onWhatsApp() {
    const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const text = encodeURIComponent(
      `${propertyTitle ? `${propertyTitle} — ` : ''}${copy.shareWhatsAppPrefix} ${url}`,
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  async function onNativeShare() {
    const url = shareUrl || window.location.href;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: propertyTitle || copy.shareTitle,
          text: copy.shareNativeText,
          url,
        });
        setMsg(copy.shareOk);
      } catch (e) {
        if ((e as { name?: string })?.name !== 'AbortError') setErr(copy.shareError);
      }
      return;
    }
    await onCopyLink();
  }

  function renderPostList(items: SocialPost[], emptyLabel: string) {
    if (items.length === 0) {
      return <p className="text-sm text-slate-600">{emptyLabel}</p>;
    }
    return (
      <ul className="flex flex-col gap-3">
        {items.map((post) => {
          const badge = post.is_official ? officialLabel(post.author_role, copy) : null;
          const answers = answersByParent[post.id] ?? [];
          return (
            <li key={post.id} className="rounded-kuteka border border-slate-200 bg-white px-3 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{post.author_name || '—'}</p>
                <time className="text-xs text-slate-500" dateTime={post.created_at}>
                  {new Date(post.created_at).toLocaleString(dateLocale)}
                </time>
              </div>
              {badge ? (
                <span className="mt-1 inline-block rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-900 ring-1 ring-sky-200">
                  {badge}
                </span>
              ) : null}
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{post.body}</p>
              {signedIn ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-xs font-semibold text-slate-600 underline-offset-2 hover:underline"
                    disabled={busy}
                    onClick={() => void onReport(post.id, 'spam')}
                  >
                    {copy.report}: {copy.reportSpam}
                  </button>
                  <button
                    type="button"
                    className="text-xs font-semibold text-slate-600 underline-offset-2 hover:underline"
                    disabled={busy}
                    onClick={() => void onReport(post.id, 'offensive')}
                  >
                    {copy.report}: {copy.reportOffensive}
                  </button>
                </div>
              ) : null}
              {answers.length > 0 ? (
                <ul className="mt-3 space-y-2 border-l-2 border-slate-200 pl-3">
                  {answers.map((ans) => {
                    const ansBadge = ans.is_official ? officialLabel(ans.author_role, copy) : null;
                    return (
                      <li key={ans.id}>
                        <p className="text-xs font-semibold text-slate-700">
                          {ans.author_name || '—'}
                        </p>
                        {ansBadge ? (
                          <span className="mt-0.5 inline-block rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900 ring-1 ring-emerald-200">
                            {ansBadge}
                          </span>
                        ) : null}
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                          {ans.body}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {signedIn && post.kind === 'question' ? (
                <div className="mt-3 flex flex-col gap-2">
                  <textarea
                    className="min-h-[3.5rem] rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    value={answerDrafts[post.id] ?? ''}
                    onChange={(e) =>
                      setAnswerDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    placeholder={copy.answerPlaceholder}
                    maxLength={4000}
                  />
                  <button
                    type="button"
                    disabled={busy || !(answerDrafts[post.id] ?? '').trim()}
                    onClick={() => void onSubmitAnswer(post.id)}
                    className="self-start rounded-kuteka bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {copy.submitAnswer}
                  </button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <section
      id="social"
      className="kuteka-detail-panel overflow-hidden"
      aria-labelledby="property-social"
    >
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-3 py-3 sm:px-4">
        <h2 id="property-social" className="sr-only">
          {copy.title}
        </h2>
        <div className="flex flex-wrap gap-2" role="toolbar" aria-label={copy.toolbarAria}>
          <button
            type="button"
            disabled={busy}
            className={actionChipClass(summary.likedByMe, true)}
            onClick={() => void onToggleLike()}
            aria-pressed={summary.likedByMe}
          >
            <span aria-hidden>❤️</span>
            {summary.likedByMe ? copy.unlike : copy.like}
            <span className="tabular-nums opacity-80">{loaded ? summary.likes : '·'}</span>
          </button>
          <button
            type="button"
            disabled={busy}
            className={actionChipClass(summary.favoritedByMe, true)}
            onClick={() => void onToggleFavorite()}
            aria-pressed={summary.favoritedByMe}
          >
            <span aria-hidden>⭐</span>
            {summary.favoritedByMe ? copy.unfavorite : copy.favorite}
            <span className="tabular-nums opacity-80">{loaded ? summary.favorites : '·'}</span>
          </button>
          <button
            type="button"
            className={actionChipClass(open === 'comments')}
            onClick={() => togglePanel('comments')}
            aria-expanded={open === 'comments'}
          >
            <span aria-hidden>💬</span>
            {copy.comments}
            <span className="tabular-nums opacity-80">{loaded ? summary.comments : '·'}</span>
          </button>
          <button
            type="button"
            className={actionChipClass(open === 'ask')}
            onClick={() => togglePanel('ask')}
            aria-expanded={open === 'ask'}
          >
            <span aria-hidden>❓</span>
            {copy.ask}
            <span className="tabular-nums opacity-80">{loaded ? summary.questions : '·'}</span>
          </button>
          <button
            type="button"
            className={actionChipClass(open === 'share')}
            onClick={() => togglePanel('share')}
            aria-expanded={open === 'share'}
          >
            <span aria-hidden>↗</span>
            {copy.share}
          </button>
        </div>
      </div>

      {(err || msg || !signedIn || open) && (
        <div className="px-4 py-3">
          {!signedIn ? <p className="text-sm text-slate-600">{copy.signInHint}</p> : null}
          {err ? <p className="text-sm text-rose-800">{err}</p> : null}
          {msg ? (
            <p className="text-sm text-emerald-800" role="status">
              {msg}
            </p>
          ) : null}

          {open === 'comments' ? (
            <div className="mt-3 flex flex-col gap-3">
              {signedIn ? (
                <form
                  className="flex flex-col gap-2"
                  onSubmit={(e) => void onSubmitPost('comment', e)}
                >
                  <textarea
                    className="min-h-[4.5rem] rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={copy.commentPlaceholder}
                    maxLength={4000}
                  />
                  <button
                    type="submit"
                    disabled={busy || !body.trim()}
                    className="self-start rounded-kuteka bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {copy.submitComment}
                  </button>
                </form>
              ) : null}
              {renderPostList(comments, copy.emptyComments)}
            </div>
          ) : null}

          {open === 'ask' ? (
            <div className="mt-3 flex flex-col gap-3">
              {signedIn ? (
                <form
                  className="flex flex-col gap-2"
                  onSubmit={(e) => void onSubmitPost('question', e)}
                >
                  <textarea
                    className="min-h-[4.5rem] rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={copy.questionPlaceholder}
                    maxLength={4000}
                  />
                  <button
                    type="submit"
                    disabled={busy || !body.trim()}
                    className="self-start rounded-kuteka bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {copy.submitQuestion}
                  </button>
                </form>
              ) : null}
              {renderPostList(questions, copy.emptyQuestions)}
            </div>
          ) : null}

          {open === 'share' ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onWhatsApp}
                className="rounded-kuteka border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-950"
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => void onCopyLink()}
                className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
              >
                {copy.copyLink}
              </button>
              <button
                type="button"
                onClick={() => void onNativeShare()}
                className="rounded-kuteka border border-sky-300 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-950"
              >
                {copy.shareNative}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
