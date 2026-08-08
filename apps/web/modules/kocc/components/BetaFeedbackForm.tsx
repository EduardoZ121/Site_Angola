'use client';

import { useState } from 'react';
import { Button } from '@kuteka/ui';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getShellCopy } from '@/modules/shell/content';
import { submitBetaFeedback } from '../services/kocc-client';

type BetaFeedbackFormProps = {
  pagePath?: string;
};

/**
 * Canal leve de feedback/bugs para a fase Beta — alimenta o Painel Beta no KOCC.
 */
export function BetaFeedbackForm({ pagePath }: BetaFeedbackFormProps) {
  const { locale } = useLocale();
  const copy = getShellCopy(locale).betaFeedback;
  const [kind, setKind] = useState<'feedback' | 'bug'>('feedback');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const res = await submitBetaFeedback({
      kind,
      body,
      pagePath: pagePath ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message || copy.error);
      return;
    }
    setBody('');
    setMessage(copy.success);
  }

  return (
    <section
      className="kuteka-detail-panel flex flex-col gap-3 p-5"
      aria-labelledby="beta-feedback"
    >
      <div>
        <p className="kuteka-detail-eyebrow">{copy.eyebrow}</p>
        <h2 id="beta-feedback" className="kuteka-detail-title mt-1">
          {copy.title}
        </h2>
        <p className="kuteka-detail-body mt-1">{copy.subtitle}</p>
      </div>
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input
              type="radio"
              name="beta-kind"
              checked={kind === 'feedback'}
              onChange={() => setKind('feedback')}
            />
            {copy.kindFeedback}
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input
              type="radio"
              name="beta-kind"
              checked={kind === 'bug'}
              onChange={() => setKind('bug')}
            />
            {copy.kindBug}
          </label>
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
