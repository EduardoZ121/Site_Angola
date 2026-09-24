'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@kuteka/ui';
import { formatBetaActorHint } from '../lib/beta-feedback-actor';
import { betaFeedbackKindLabel } from '../lib/beta-feedback-labels';
import {
  BETA_FEEDBACK_STATUSES,
  betaFeedbackStatusLabel,
  canTransitionBetaFeedbackStatus,
  isBetaFeedbackStatus,
  type BetaFeedbackStatus,
} from '../lib/beta-feedback-status';
import { formatBetaPageContextLines } from '../lib/beta-feedback-triage';
import type { KoccBetaFeedbackRow } from '../services/kocc-client';

type BetaFeedbackInboxItemProps = {
  row: KoccBetaFeedbackRow;
  busy?: boolean;
  canEdit?: boolean;
  onSave?: (input: { status: string; resolutionNotes?: string | null }) => void;
};

function currentStatus(row: KoccBetaFeedbackRow): BetaFeedbackStatus {
  return row.status && isBetaFeedbackStatus(row.status) ? row.status : 'received';
}

export function BetaFeedbackInboxItem({
  row,
  busy = false,
  canEdit = false,
  onSave,
}: BetaFeedbackInboxItemProps) {
  const status = currentStatus(row);
  const savedNotes = row.resolution_notes?.trim() ?? '';
  const [notes, setNotes] = useState(savedNotes);
  const context = formatBetaPageContextLines(row.page_context);
  const notesDirty = notes.trim() !== savedNotes;
  const actor = formatBetaActorHint(row.actor_id);

  useEffect(() => {
    setNotes(savedNotes);
  }, [savedNotes, row.id]);

  return (
    <li className="flex flex-col gap-2 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={row.kind === 'bug' ? 'default' : 'brand'}>
          {betaFeedbackKindLabel(row.kind)}
        </Badge>
        <Badge variant="default">{betaFeedbackStatusLabel(status)}</Badge>
        <span className="font-mono text-xs text-slate-500">
          {new Date(row.created_at).toLocaleString('pt-AO', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </span>
        {row.page_path ? (
          <span className="truncate font-mono text-xs text-slate-500">{row.page_path}</span>
        ) : null}
        {actor ? (
          <span className="font-mono text-xs text-slate-500" title={row.actor_id ?? undefined}>
            {actor}
          </span>
        ) : null}
      </div>
      <p className="whitespace-pre-wrap text-sm text-slate-800">{row.body}</p>
      {context.length > 0 ? (
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
          {context.map((line) => (
            <li key={line.key}>
              <span className="text-slate-400">{line.label}: </span>
              <span className="font-mono text-slate-600">{line.value}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {savedNotes ? (
        <p className="text-xs text-slate-600">
          <span className="font-medium text-slate-500">Nota interna: </span>
          {savedNotes}
        </p>
      ) : null}
      {canEdit && onSave ? (
        <div className="flex flex-col gap-2">
          <label className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span>Estado</span>
            <select
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
              value={status}
              disabled={busy}
              aria-label={`Estado do relato ${row.id}`}
              onChange={(e) => {
                const next = e.target.value;
                if (!isBetaFeedbackStatus(next) || next === status) return;
                onSave({
                  status: next,
                  resolutionNotes: notesDirty ? notes.trim() : null,
                });
              }}
            >
              {BETA_FEEDBACK_STATUSES.map((option) => (
                <option
                  key={option}
                  value={option}
                  disabled={!canTransitionBetaFeedbackStatus(status, option)}
                >
                  {betaFeedbackStatusLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            <span>Nota interna (só operação, não vai para o autor)</span>
            <textarea
              className="min-h-[3rem] w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
              value={notes}
              maxLength={500}
              disabled={busy}
              placeholder="Opcional — motivo do estado, sem dados sensíveis extra."
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          {notesDirty ? (
            <button
              type="button"
              className="w-fit rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-white disabled:opacity-60"
              disabled={busy}
              onClick={() =>
                onSave({
                  status,
                  resolutionNotes: notes.trim(),
                })
              }
            >
              {busy ? 'A guardar…' : 'Guardar nota'}
            </button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
