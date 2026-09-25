'use client';

import { useState } from 'react';
import { submitBetaFeedback } from '../services/kocc-client';

type ExperiencePulseProps = {
  pagePath: string;
  context?: Record<string, string>;
};

/** One-tap usefulness note. Stored as an evaluation, not as a reward or a score. */
export function ExperiencePulse({ pagePath, context }: ExperiencePulseProps) {
  const [sent, setSent] = useState<'sim' | 'nao' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function vote(useful: boolean) {
    if (busy || sent) return;
    setBusy(true);
    setError(null);
    const result = await submitBetaFeedback({
      kind: 'avaliacao',
      body: useful ? 'Esta experiência foi útil: sim.' : 'Esta experiência foi útil: não.',
      pagePath,
      pageContext: context,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message || 'Não foi possível registar. Tente outra vez.');
      return;
    }
    setSent(useful ? 'sim' : 'nao');
  }

  return (
    <section className="rounded-kuteka border border-slate-200 bg-white px-4 py-3" aria-label="Utilidade da experiência">
      {sent ? (
        <p className="text-sm text-slate-700">
          Registado como avaliação{sent === 'sim' ? ': útil' : ': não útil'}. Não altera preço, destaque nem saldo.
        </p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-700">Esta experiência foi útil?</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void vote(true)}
              className="rounded-kuteka border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-800"
            >
              Sim
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void vote(false)}
              className="rounded-kuteka border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-800"
            >
              Não
            </button>
          </div>
        </div>
      )}
      {error ? <p className="mt-2 text-sm text-amber-900">{error}</p> : null}
    </section>
  );
}
