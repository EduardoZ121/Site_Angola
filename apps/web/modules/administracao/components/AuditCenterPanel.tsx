'use client';

import { useEffect, useState } from 'react';
import { Text } from '@kuteka/ui';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getAdministracaoCopy } from '../content';
import { listAuditLogs, type AuditLogRow } from '../services/governance-client';

function formatJson(value: unknown): string {
  if (value == null) return '—';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function localeTag(locale: string): string {
  return locale === 'en' ? 'en-GB' : `${locale}-PT`;
}

export function AuditCenterPanel() {
  const { locale } = useLocale();
  const copy = getAdministracaoCopy(locale);
  const [items, setItems] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await listAuditLogs(40);
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

  return (
    <section className="flex flex-col gap-3" aria-labelledby="audit-center-heading">
      <div className="flex flex-col gap-1">
        <h2 id="audit-center-heading" className="text-sm font-semibold text-slate-800">
          {copy.auditTitle}
        </h2>
        <Text className="text-sm text-slate-500">{copy.auditHint}</Text>
      </div>

      <SoftListSlot pending={loading && items.length === 0}>
        {error ? (
          <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {error}
          </div>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <EmptyState title={copy.auditTitle} description={copy.emptyAudit} />
        ) : null}

        {items.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {items.map((row) => {
              const entity =
                row.entity_type || row.entity_id
                  ? [row.entity_type, row.entity_id].filter(Boolean).join(' · ')
                  : '—';
              const roles = row.actor_roles?.length ? row.actor_roles.join(', ') : '—';
              return (
                <li
                  key={row.id}
                  className="flex flex-col gap-2 rounded-kuteka border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium text-slate-900">{row.action}</p>
                    <time className="text-xs text-slate-500" dateTime={row.created_at}>
                      {new Date(row.created_at).toLocaleString(localeTag(locale))}
                    </time>
                  </div>
                  <dl className="grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                    <div>
                      <dt className="inline text-slate-500">{copy.auditActor}: </dt>
                      <dd className="inline">{row.actor_name ?? row.actor_id ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="inline text-slate-500">{copy.auditRoles}: </dt>
                      <dd className="inline">{roles}</dd>
                    </div>
                    <div>
                      <dt className="inline text-slate-500">{copy.auditReason}: </dt>
                      <dd className="inline">{row.reason ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="inline text-slate-500">{copy.auditEntity}: </dt>
                      <dd className="inline break-all">{entity}</dd>
                    </div>
                  </dl>
                  <details className="text-sm">
                    <summary className="cursor-pointer text-slate-600 hover:text-slate-900">
                      {copy.auditBefore} / {copy.auditAfter}
                    </summary>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <pre className="overflow-x-auto rounded-kuteka bg-slate-50 p-2 text-xs text-slate-700">
                        {formatJson(row.before_state)}
                      </pre>
                      <pre className="overflow-x-auto rounded-kuteka bg-slate-50 p-2 text-xs text-slate-700">
                        {formatJson(row.after_state)}
                      </pre>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        ) : null}
      </SoftListSlot>
    </section>
  );
}
