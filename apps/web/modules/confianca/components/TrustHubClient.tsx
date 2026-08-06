'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { TRUST_DOC_TYPES } from '@kuteka/validation';
import { Badge, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { ForbiddenPanel } from '@/modules/shell/components/ForbiddenPanel';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getConfiancaCopy } from '../content';
import { listMyTrustDocuments, type TrustDocumentRow } from '../services/trust-client';

function latestByType(rows: TrustDocumentRow[]) {
  const map = new Map<string, TrustDocumentRow>();
  for (const row of rows) {
    if (!map.has(row.doc_type)) map.set(row.doc_type, row);
  }
  return map;
}

export function TrustHubClient() {
  const { locale } = useLocale();
  const copy = getConfiancaCopy(locale);
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const canManage = sessionStatus === 'ready' && !!session?.permissions.includes('trust.manage');
  const isAdmin = sessionStatus === 'ready' && !!session?.permissions.includes('admin.panel');
  const canContracts =
    sessionStatus === 'ready' && !!session?.permissions.includes('contracts.manage');
  const accessPending = sessionStatus === 'loading';
  const denied = sessionStatus === 'ready' && !canManage;

  const [rows, setRows] = useState<TrustDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!canManage) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const result = await listMyTrustDocuments();
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setRows([]);
      } else {
        setError(null);
        setRows(result.data);
      }
      setLoading(false);
    }
    if (sessionStatus === 'error') {
      setLoading(false);
      return;
    }
    if (sessionStatus === 'ready') void load();
    return () => {
      cancelled = true;
    };
  }, [canManage, sessionStatus]);

  const byType = useMemo(() => latestByType(rows), [rows]);

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-8">
        <header className="kuteka-glass flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Heading level={1}>{copy.title}</Heading>
            <Text className="text-slate-600">{copy.subtitle}</Text>
          </div>
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              {isAdmin ? (
                <Link
                  href="/app/confianca/revisao"
                  className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
                >
                  {copy.review}
                </Link>
              ) : null}
              <Link
                href="/app/confianca/submeter"
                className={cn(buttonVariants({ variant: 'primary' }), 'w-fit shrink-0')}
              >
                {copy.submit}
              </Link>
            </div>
          ) : null}
        </header>

        {accessPending ? <SoftListSlot pending /> : null}
        {denied ? <ForbiddenPanel message={copy.forbidden} /> : null}

        {canManage ? (
          <SoftListSlot pending={loading && rows.length === 0}>
            <p className="text-sm text-slate-500">{copy.mvpNote}</p>

            {error ? (
              <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {error}
              </div>
            ) : null}

            <section className="flex flex-col gap-3" aria-labelledby="checklist-heading">
              <div className="flex flex-col gap-1">
                <h2 id="checklist-heading" className="text-sm font-semibold text-slate-800">
                  {copy.checklistTitle}
                </h2>
                <Text className="text-sm text-slate-500">{copy.checklistHint}</Text>
              </div>
              {!loading ? (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {TRUST_DOC_TYPES.map((type) => {
                    const row = byType.get(type);
                    const status = row?.status ?? 'pending';
                    const label =
                      status === 'pending'
                        ? copy.statuses.pending
                        : (copy.statuses[status as keyof typeof copy.statuses] ?? status);
                    return (
                      <li
                        key={type}
                        className="rounded-kuteka border border-slate-200 bg-white px-4 py-4"
                      >
                        <p className="font-medium text-slate-800">{copy.docTypes[type]}</p>
                        <p className="mt-2 text-sm text-slate-500">
                          {copy.fields.status}:{' '}
                          <span className="font-medium text-slate-700">{label}</span>
                        </p>
                        {row?.rejection_reason ? (
                          <p className="mt-1 text-sm text-amber-800">{row.rejection_reason}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </section>

            <section className="flex flex-col gap-3" aria-labelledby="history-heading">
              <div className="flex flex-col gap-1">
                <h2 id="history-heading" className="text-sm font-semibold text-slate-800">
                  {copy.historyLabel}
                </h2>
                <Text className="text-sm text-slate-500">{copy.historyHint}</Text>
              </div>
              {!loading && rows.length === 0 ? (
                <EmptyState title={copy.emptyHistoryTitle} description={copy.emptyHistory} />
              ) : null}
              {!loading && rows.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {rows.map((row) => (
                    <li
                      key={row.id}
                      className="flex flex-col gap-1 rounded-kuteka border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-800">
                          {copy.docTypes[row.doc_type as keyof typeof copy.docTypes] ??
                            row.doc_type}
                        </p>
                        <p className="text-sm text-slate-500">
                          {copy.fields.createdAt}:{' '}
                          {new Date(row.created_at).toLocaleString('pt-PT')}
                        </p>
                        {row.notes ? (
                          <p className="mt-1 text-sm text-slate-600">{row.notes}</p>
                        ) : null}
                      </div>
                      <Badge
                        variant={
                          row.status === 'accepted'
                            ? 'success'
                            : row.status === 'rejected'
                              ? 'danger'
                              : 'warning'
                        }
                        className="w-fit shrink-0"
                      >
                        {copy.statuses[row.status as keyof typeof copy.statuses] ?? row.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>

            <FlowNextSteps
              title="Depois da verificação"
              steps={[
                { href: '/app/habitacao/explorar', label: 'Explorar habitação', primary: true },
                ...(canContracts ? [{ href: '/app/contratos', label: 'Preparar contrato' }] : []),
                { href: '/app/agente', label: 'Área do Agente' },
                { href: '/app/admin', label: 'Administração' },
              ]}
            />
          </SoftListSlot>
        ) : null}
      </div>
    </SessionStatusGate>
  );
}
