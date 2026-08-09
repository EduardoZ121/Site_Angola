'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Label, Text, Textarea } from '@kuteka/ui';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getAdministracaoCopy } from '../content';
import {
  listContentReports,
  resolveContentReport,
  type ContentReportRow,
  type ContentReportStatus,
} from '../services/governance-client';

function localeTag(locale: string): string {
  return locale === 'en' ? 'en-GB' : `${locale}-PT`;
}

export function ModerationCenterPanel() {
  const { locale } = useLocale();
  const copy = getAdministracaoCopy(locale);
  const [items, setItems] = useState<ContentReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function reload() {
    const result = await listContentReports(50);
    if (!result.ok) {
      setError(result.message);
      setItems([]);
      return;
    }
    setError(null);
    setItems(result.data);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await listContentReports(50);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setItems([]);
      } else {
        setError(null);
        setItems(result.data);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onResolve(row: ContentReportRow, status: ContentReportStatus) {
    setBusyId(row.id);
    setError(null);
    setMessage(null);
    const result = await resolveContentReport(row.id, status, notes[row.id]);
    setBusyId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(copy.moderationOk);
    setNotes((prev) => {
      const next = { ...prev };
      delete next[row.id];
      return next;
    });
    await reload();
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="moderation-center-heading">
      <div className="flex flex-col gap-1">
        <h2 id="moderation-center-heading" className="text-sm font-semibold text-slate-800">
          {copy.moderationTitle}
        </h2>
        <Text className="text-sm text-slate-500">{copy.moderationHint}</Text>
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

        {!loading && !error && items.length === 0 ? (
          <EmptyState title={copy.moderationTitle} description={copy.emptyModeration} />
        ) : null}

        {items.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {items.map((row) => {
              const busy = busyId === row.id;
              return (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 rounded-kuteka border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-slate-900">
                        {copy.moderationTarget}: {row.target_kind} · {row.target_id}
                      </p>
                      <p className="text-sm text-slate-500">
                        {copy.moderationReason}: {row.reason_code}
                        {row.details ? ` — ${row.details}` : ''}
                      </p>
                      <time className="text-xs text-slate-500" dateTime={row.created_at}>
                        {new Date(row.created_at).toLocaleString(localeTag(locale))}
                      </time>
                    </div>
                    <Badge variant="brand" className="w-fit">
                      {row.status}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`mod-notes-${row.id}`}>{copy.moderationNotes}</Label>
                    <Textarea
                      id={`mod-notes-${row.id}`}
                      value={notes[row.id] ?? ''}
                      disabled={busy}
                      rows={2}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void onResolve(row, 'resolved')}
                    >
                      {busy ? copy.moderationBusy : copy.moderationResolve}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busy}
                      onClick={() => void onResolve(row, 'dismissed')}
                    >
                      {copy.moderationDismiss}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={busy || row.status === 'reviewing'}
                      onClick={() => void onResolve(row, 'reviewing')}
                    >
                      {copy.moderationReviewing}
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
