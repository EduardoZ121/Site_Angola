'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TRUST_DOC_TYPES } from '@kuteka/validation';
import { Button, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { ModuleSkeleton } from '@/modules/shell/components/ModuleSkeleton';
import { getConfiancaCopy } from '../content/pt';
import { submitTrustDocument } from '../services/trust-client';

export function TrustSubmitClient() {
  const copy = getConfiancaCopy();
  const router = useRouter();
  const { session, status: sessionStatus } = useAppSession();
  const canManage = sessionStatus === 'ready' && !!session?.permissions.includes('trust.manage');

  const [docType, setDocType] = useState<(typeof TRUST_DOC_TYPES)[number]>('identity');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    const result = await submitTrustDocument({
      docType,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(copy.submitted);
    router.push('/app/confianca');
  }

  if (sessionStatus === 'loading') return <ModuleSkeleton rows={3} />;

  if (!canManage) {
    return (
      <div className="flex flex-col gap-4">
        <Heading level={1}>{copy.submitTitle}</Heading>
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {copy.forbidden}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            Verificação
          </p>
          <Heading level={1}>{copy.submitTitle}</Heading>
          <Text className="text-slate-600">{copy.submitHint}</Text>
        </div>
        <Link
          href="/app/habitacao/explorar"
          className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
        >
          Explorar habitação
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

      <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-800">{copy.fields.docType}</span>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as (typeof TRUST_DOC_TYPES)[number])}
            className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-slate-900"
            required
          >
            {TRUST_DOC_TYPES.map((type) => (
              <option key={type} value={type}>
                {copy.docTypes[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-800">{copy.fields.notes}</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={2000}
            className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-slate-900"
            placeholder="Ex.: BI nº …, emitido em …"
          />
        </label>

        <Button type="submit" variant="primary" disabled={saving} className="w-fit">
          {saving ? copy.submitting : copy.submit}
        </Button>
      </form>
    </div>
  );
}
