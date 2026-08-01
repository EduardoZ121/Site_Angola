'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Button, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getAdministracaoCopy } from '../content/pt';
import { assignCertifiedAgent, listAdminUsers, type AdminUserRow } from '../services/admin-client';

export function AdminUsersClient() {
  const copy = getAdministracaoCopy();
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const allowed = sessionStatus === 'ready' && !!session?.permissions.includes('admin.panel');
  const accessPending = sessionStatus === 'loading';
  const denied = sessionStatus === 'ready' && !allowed;

  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function reload() {
    const result = await listAdminUsers();
    if (!result.ok) {
      setError(result.message);
      setRows([]);
      return;
    }
    setError(null);
    setRows(result.data);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!allowed) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const result = await listAdminUsers();
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
    if (sessionStatus === 'ready') void load();
    return () => {
      cancelled = true;
    };
  }, [allowed, sessionStatus]);

  async function onAssign(userId: string) {
    setBusyId(userId);
    setMessage(null);
    setError(null);
    const result = await assignCertifiedAgent({ userId });
    setBusyId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.already ? copy.alreadyAgent : copy.assigned);
    await reload();
  }

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
              Operação
            </p>
            <Heading level={1}>{copy.usersTitle}</Heading>
            <Text className="text-slate-600">{copy.usersHint}</Text>
          </div>
          {allowed ? (
            <Link
              href="/app/confianca/revisao"
              className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
            >
              Rever Confiança
            </Link>
          ) : null}
        </header>

        {accessPending ? <SoftListSlot pending /> : null}
        {denied ? (
          <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {copy.forbidden}
          </div>
        ) : null}

        {allowed ? (
          <SoftListSlot pending={loading && rows.length === 0}>
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

            {!loading && rows.length === 0 ? (
              <EmptyState title={copy.emptyUsersTitle} description={copy.emptyUsers} />
            ) : null}

            {rows.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {rows.map((row) => {
                  const isAgent = row.roles.includes('certified_agent');
                  return (
                    <li
                      key={row.id}
                      className="flex flex-col gap-3 rounded-kuteka border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">
                          {row.display_name || 'Utilizador sem nome'}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-slate-400">{row.id}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {row.roles.length > 0 ? (
                            row.roles.map((code) => (
                              <Badge key={code} variant="brand">
                                {copy.roleLabels[code as keyof typeof copy.roleLabels] ?? code}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500">Sem papéis</span>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        disabled={isAgent || busyId === row.id}
                        onClick={() => void onAssign(row.id)}
                        className="w-fit shrink-0"
                      >
                        {busyId === row.id
                          ? copy.assigning
                          : isAgent
                            ? copy.alreadyAgent
                            : copy.assignAgent}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </SoftListSlot>
        ) : null}
      </div>
    </SessionStatusGate>
  );
}
