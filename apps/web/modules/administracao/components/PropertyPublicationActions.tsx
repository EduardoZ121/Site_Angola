'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Checkbox, Label, Textarea } from '@kuteka/ui';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { MessagePropertyOwnerButton } from '@/modules/mensagens/components/MessagePropertyOwnerButton';
import { getAdministracaoCopy } from '../content';
import {
  decidePublication,
  listPendingReasons,
  type PendingReason,
  type PublicationDecision,
} from '../services/publication-review-client';

const REASONS_REQUIRED: PublicationDecision[] = [
  'pending',
  'reject',
  'request_corrections',
  'request_documents',
  'request_technical_visit',
];

type Props = {
  propertyId: string;
  ownerId?: string | null;
  propertyTitle?: string | null;
  lifecycleStatus?: string | null;
};

/**
 * In-sheet operational actions for reviewers (Admin / Supervisor / Super).
 * Visible on Habitação + Património detail when the viewer can review.
 */
export function PropertyPublicationActions({
  propertyId,
  ownerId,
  propertyTitle,
  lifecycleStatus,
}: Props) {
  const { locale } = useLocale();
  const copy = getAdministracaoCopy(locale);
  const { session, status } = useAppSession();
  const canReview =
    status === 'ready' &&
    !!session?.permissions.some((p) => p === 'properties.review' || p === 'admin.panel');
  const canApproveReject =
    status === 'ready' &&
    !!session?.roles.some((r) =>
      ['administrator', 'super_administrator', 'founder', 'co_founder'].includes(r),
    );

  const [catalog, setCatalog] = useState<PendingReason[]>([]);
  const [reasons, setReasons] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!canReview) return;
    let cancelled = false;
    void listPendingReasons().then((res) => {
      if (cancelled || !res.ok) return;
      setCatalog(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [canReview]);

  if (!canReview) return null;

  function toggleReason(code: string) {
    setReasons((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  async function onDecide(decision: PublicationDecision) {
    if (REASONS_REQUIRED.includes(decision) && reasons.length === 0 && !notes.trim()) {
      setError(copy.decideError);
      setMessage(null);
      return;
    }
    if ((decision === 'approve' || decision === 'reject') && !canApproveReject) {
      setError(copy.supervisorCannotApprove);
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await decidePublication({
      propertyId,
      decision,
      pendingReasonCodes: reasons,
      adminNotes: notes || null,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(copy.decideOk);
    setReasons([]);
    setNotes('');
  }

  const inReview =
    !lifecycleStatus ||
    [
      'submetido',
      'em_analise_kai',
      'em_analise_admin',
      'em_analise_documental',
      'em_preparacao',
      'em_inspecao_tecnica',
      'pendente',
    ].includes(lifecycleStatus) ||
    lifecycleStatus.includes('analise');

  return (
    <section
      id="revisao-publicacao"
      className="kuteka-detail-panel border-amber-200 bg-amber-50/40 p-4"
      aria-labelledby="property-review-actions"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="property-review-actions" className="kuteka-detail-title text-base">
            {copy.inSheetReviewTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-700">{copy.inSheetReviewHint}</p>
        </div>
        {lifecycleStatus ? <Badge variant="warning">{lifecycleStatus}</Badge> : null}
      </div>

      {!inReview ? <p className="mt-3 text-sm text-slate-600">{copy.inSheetNotInQueue}</p> : null}

      {ownerId ? (
        <div className="mt-3">
          <MessagePropertyOwnerButton
            propertyId={propertyId}
            ownerId={ownerId}
            propertyTitle={propertyTitle}
            label={copy.contactPartner}
          />
        </div>
      ) : null}

      {catalog.length > 0 ? (
        <fieldset className="mt-4 flex flex-col gap-2">
          <legend className="text-sm font-medium text-slate-800">{copy.reasons}</legend>
          <ul className="grid gap-2 sm:grid-cols-2">
            {catalog.map((reason) => {
              const id = `sheet-${propertyId}-${reason.code}`;
              return (
                <li key={reason.code}>
                  <label
                    htmlFor={id}
                    className="flex cursor-pointer items-start gap-2 rounded-kuteka border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    <Checkbox
                      id={id}
                      checked={reasons.includes(reason.code)}
                      disabled={busy}
                      onChange={() => toggleReason(reason.code)}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className="font-medium text-slate-800">{reason.label_pt}</span>
                      <span className="text-xs text-slate-500">{reason.solution_pt}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ) : null}

      <div className="mt-3 flex flex-col gap-1.5">
        <Label htmlFor={`sheet-notes-${propertyId}`}>{copy.notesRequired}</Label>
        <Textarea
          id={`sheet-notes-${propertyId}`}
          value={notes}
          disabled={busy}
          rows={2}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error ? (
        <p className="mt-2 text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-2 text-sm text-emerald-800" role="status">
          {message}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {canApproveReject ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={busy}
            onClick={() => void onDecide('approve')}
          >
            {copy.approve}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => void onDecide('pending')}
        >
          {copy.pending}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => void onDecide('request_corrections')}
        >
          {copy.requestCorrections}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => void onDecide('request_documents')}
        >
          {copy.requestDocs}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => void onDecide('request_technical_visit')}
        >
          {copy.requestVisit}
        </Button>
        {canApproveReject ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => void onDecide('reject')}
          >
            {copy.reject}
          </Button>
        ) : null}
      </div>
      {!canApproveReject ? (
        <p className="mt-2 text-xs text-slate-600">{copy.supervisorScopeHint}</p>
      ) : null}
    </section>
  );
}
