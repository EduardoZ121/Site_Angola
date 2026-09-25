'use client';

import { useState } from 'react';
import { Button } from '@kuteka/ui';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getShellCopy } from '@/modules/shell/content';
import { submitBetaFeedback, trackBetaFeature } from '../services/kocc-client';

type BetaKind = 'feedback' | 'bug' | 'avaliacao' | 'reclamacao';

type BetaFeedbackFormProps = {
  pagePath?: string;
  /** Product form excludes complaints. Pass reclamacao alone for the operational form. */
  kinds?: readonly BetaKind[];
  title?: string;
  subtitle?: string;
};

const DEFAULT_KINDS: readonly BetaKind[] = ['feedback', 'bug', 'avaliacao'];

/**
 * Canal leve de feedback para a fase Beta — alimenta a caixa Beta no KOCC.
 * Reclamação fica noutro formulário para não se misturar com sugestão.
 */
export function BetaFeedbackForm({
  pagePath,
  kinds = DEFAULT_KINDS,
  title,
  subtitle,
}: BetaFeedbackFormProps) {
  const { locale } = useLocale();
  const copy = getShellCopy(locale).betaFeedback;
  const options = kinds.length > 0 ? kinds : DEFAULT_KINDS;
  const [kind, setKind] = useState<BetaKind>(options[0] ?? 'feedback');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const labels: Record<BetaKind, string> = {
    feedback: copy.kindFeedback,
    bug: copy.kindBug,
    avaliacao: copy.kindReview,
    reclamacao: copy.kindComplaint,
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const res = await submitBetaFeedback({
      kind,
      body,
      pagePath: pagePath ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
      pageContext:
        typeof window !== 'undefined'
          ? {
              locale,
              viewport: `${window.innerWidth}x${window.innerHeight}`,
              path: window.location.pathname,
            }
          : { locale },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message || copy.error);
      return;
    }
    setBody('');
    setMessage(copy.success);
    void trackBetaFeature(
      kind === 'bug'
        ? 'beta.feedback.bug'
        : kind === 'avaliacao'
          ? 'beta.feedback.review'
          : kind === 'reclamacao'
            ? 'beta.feedback.complaint'
            : 'beta.feedback.suggestion',
      labels[kind],
    );
  }

  const headingId = options.length === 1 && options[0] === 'reclamacao' ? 'beta-complaint' : 'beta-feedback';

  return (
    <section
      className="kuteka-detail-panel flex flex-col gap-3 p-5"
      aria-labelledby={headingId}
    >
      <div>
        <p className="kuteka-detail-eyebrow">{copy.eyebrow}</p>
        <h2 id={headingId} className="kuteka-detail-title mt-1">
          {title ?? copy.title}
        </h2>
        <p className="kuteka-detail-body mt-1">{subtitle ?? copy.subtitle}</p>
      </div>
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="radio"
                name={`beta-kind-${options.join('-')}`}
                checked={kind === option}
                onChange={() => setKind(option)}
              />
              {labels[option]}
            </label>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-sm text-slate-800">
          <span>{copy.bodyLabel}</span>
          <textarea
            className="min-h-[6rem] w-full rounded-kuteka border border-slate-200 bg-white px-3 py-2 text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={copy.placeholder}
            required
            minLength={3}
            maxLength={4000}
          />
        </label>
        {error ? <p className="text-sm text-amber-900">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-900">{message}</p> : null}
        <Button type="submit" size="sm" loading={busy} className="w-fit">
          {busy ? copy.sending : copy.submit}
        </Button>
      </form>
    </section>
  );
}
