'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Heading, Text } from '@kuteka/ui';
import { createBrowserClient } from '@/lib/supabase/client';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useRoleExperience } from '@/modules/shell/components/RoleExperienceProvider';
import {
  ESCALATION_PRIORITY_LABELS,
  ESCALATION_TARGET_LABELS,
  createOperationalEscalation,
  listOperationalEscalations,
  resolveOperationalEscalation,
  type EscalationPriority,
  type EscalationTarget,
  type OperationalEscalation,
} from '../services/escalation-client';

function defaultTarget(mode: string): EscalationTarget {
  if (mode === 'supervisor') return 'administrator';
  if (mode === 'administrator') return 'super_administrator';
  return 'founder';
}

function targetsForMode(mode: string): EscalationTarget[] {
  if (mode === 'supervisor') return ['administrator', 'super_administrator', 'founder'];
  if (mode === 'administrator') return ['super_administrator', 'founder'];
  if (mode === 'super_administrator') return ['founder'];
  return ['administrator', 'super_administrator', 'founder'];
}

function statusLabel(status: string, notes?: string | null): string {
  if (status === 'cancelled' && notes?.includes('Cargo recusado')) return 'Recusada';
  if (status === 'cancelled' && notes?.includes('Anulada')) return 'Anulada';
  if (status === 'open') return 'Aberta';
  if (status === 'acknowledged') return 'Cargo aceite';
  if (status === 'resolved') return 'Resolvida';
  if (status === 'cancelled') return 'Cancelada';
  return status;
}

function holdsTarget(roles: string[], target: EscalationTarget): boolean {
  return roles.includes(target);
}

function dueLabel(dueAt: string | null): string {
  if (!dueAt) return 'Sem prazo';
  const ms = new Date(dueAt).getTime() - Date.now();
  const hours = Math.round(ms / 3_600_000);
  if (hours < 0) return `SLA ultrapassado (${Math.abs(hours)}h)`;
  if (hours < 24) return `Prazo em ${hours}h`;
  return `Prazo ${new Date(dueAt).toLocaleString('pt-PT')}`;
}

type EscalationPanelProps = {
  propertyId?: string | null;
  reviewId?: string | null;
  compact?: boolean;
};

/**
 * Formal escalation workflow: Supervisor → Admin → Super → Founder.
 * Reason, priority, due, status, audit (via RPCs).
 */
export function EscalationPanel({ propertyId, reviewId, compact }: EscalationPanelProps) {
  const { mode } = useRoleExperience();
  const { session } = useAppSession();
  const [userId, setUserId] = useState<string | null>(null);
  const [rows, setRows] = useState<OperationalEscalation[]>([]);
  const [listQuery, setListQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [reason, setReason] = useState('');
  const [target, setTarget] = useState<EscalationTarget>(defaultTarget(mode));
  const [priority, setPriority] = useState<EscalationPriority>('normal');
  const [dueHours, setDueHours] = useState('12');

  const reload = useCallback(async () => {
    setLoading(true);
    const result = await listOperationalEscalations(40);
    if (!result.ok) setError(result.message);
    else {
      setError(null);
      setRows(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const client = createBrowserClient();
    void client.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    setTarget(defaultTarget(mode));
  }, [mode]);

  const shown = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (!q) return true;
      return [row.reason, row.created_by_role, row.created_by_name, row.property_title, row.status, statusLabel(row.status)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [listQuery, rows, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
    return [...counts.entries()];
  }, [rows]);

  async function onCreate() {
    setBusy(true);
    setMessage(null);
    setError(null);
    const result = await createOperationalEscalation({
      targetLevel: target,
      reason,
      priority,
      propertyId,
      reviewId,
      dueHours: Number(dueHours) || 12,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setReason('');
    setMessage('Escalação criada — notificação/auditoria registadas.');
    await reload();
  }

  async function onResolve(
    id: string,
    status: 'acknowledged' | 'resolved' | 'cancelled',
    resolutionNotes: string,
  ) {
    setBusy(true);
    setError(null);
    const result = await resolveOperationalEscalation({
      escalationId: id,
      status,
      resolutionNotes,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(
      status === 'acknowledged'
        ? 'Cargo aceite. O caso fica consigo.'
        : resolutionNotes.includes('Cargo recusado')
          ? 'Cargo recusado. Quem abriu vê a recusa.'
          : resolutionNotes.includes('Anulada')
            ? 'Escalação anulada.'
            : 'Escalação resolvida.',
    );
    await reload();
  }

  const openCount = rows.filter((r) => r.status === 'open' || r.status === 'acknowledged').length;

  return (
    <section
      id="escalacoes"
      className="kuteka-detail-panel flex flex-col gap-4 p-5"
      aria-labelledby="escalacoes-heading"
    >
      <div>
        <p className="kuteka-detail-eyebrow">Workflow formal</p>
        <Heading level={compact ? 3 : 2} id="escalacoes-heading">
          Escalações operacionais
        </Heading>
        <Text className="mt-1 text-sm text-slate-600">
          Supervisor → Admin → Super Admin → Founder. Quem tem o cargo de destino pode aceitar ou recusar o caso. Aceitar não muda o papel da conta. Abertas: {openCount}.
        </Text>
      </div>

      {error ? (
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-kuteka border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          {message}
        </div>
      ) : null}

      <div className="grid gap-3 rounded-kuteka border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">Nova escalação</p>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Motivo</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="rounded-kuteka border border-slate-200 px-3 py-2"
            placeholder="Descreva o bloqueio operacional (mín. 5 caracteres)"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Escalonar para</span>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as EscalationTarget)}
              className="rounded-kuteka border border-slate-200 px-3 py-2"
            >
              {targetsForMode(mode).map((t) => (
                <option key={t} value={t}>
                  {ESCALATION_TARGET_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Prioridade</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as EscalationPriority)}
              className="rounded-kuteka border border-slate-200 px-3 py-2"
            >
              {(Object.keys(ESCALATION_PRIORITY_LABELS) as EscalationPriority[]).map((p) => (
                <option key={p} value={p}>
                  {ESCALATION_PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Prazo (horas)</span>
            <input
              type="number"
              min={1}
              max={168}
              value={dueHours}
              onChange={(e) => setDueHours(e.target.value)}
              className="rounded-kuteka border border-slate-200 px-3 py-2"
            />
          </label>
        </div>
        <Button
          type="button"
          disabled={busy || reason.trim().length < 5}
          loading={busy}
          onClick={() => void onCreate()}
          className="w-fit"
        >
          Criar escalação
        </Button>
      </div>

      <SoftListSlot pending={loading}>
        <p className="text-xs text-slate-500">Últimas 40 escalações visíveis. O prazo é o que já está gravado.</p>
        {rows.length > 0 ? (
          <div className="flex flex-col gap-2">
            <input
              value={listQuery}
              onChange={(event) => setListQuery(event.target.value)}
              placeholder="Procurar motivo, pessoa ou imóvel"
              aria-label="Procurar escalação"
              className="kuteka-ops-input w-full"
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setStatusFilter('')} className={statusFilter === '' ? 'rounded-kuteka border border-slate-900 bg-slate-900 px-3 py-1 text-xs font-semibold text-white' : 'rounded-kuteka border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700'}>
                Todas · {rows.length}
              </button>
              {statusCounts.map(([code, count]) => (
                <button key={code} type="button" onClick={() => setStatusFilter(code)} className={statusFilter === code ? 'rounded-kuteka border border-slate-900 bg-slate-900 px-3 py-1 text-xs font-semibold text-white' : 'rounded-kuteka border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700'}>
                  {statusLabel(code)} · {count}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {rows.length > 0 && shown.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma escalação neste filtro.</p>
        ) : null}
        <ul className="flex flex-col gap-2">
          {shown.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-2 rounded-kuteka border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{row.reason}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {row.created_by_role} → {ESCALATION_TARGET_LABELS[row.target_level]} ·{' '}
                    {row.created_by_name || row.created_by.slice(0, 8)} · {dueLabel(row.due_at)}
                    {row.property_title ? ` · ${row.property_title}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge
                    variant={
                      row.priority === 'critical' || row.priority === 'high' ? 'danger' : 'brand'
                    }
                  >
                    {ESCALATION_PRIORITY_LABELS[row.priority]}
                  </Badge>
                  <Badge variant={row.status === 'open' ? 'warning' : 'success'}>
                    {statusLabel(row.status, row.resolution_notes)}
                  </Badge>
                </div>
              </div>
              {row.resolution_notes ? (
                <p className="text-xs text-slate-600">{row.resolution_notes}</p>
              ) : null}
              {(row.status === 'open' || row.status === 'acknowledged') && userId ? (
                <div className="flex flex-wrap gap-2">
                  {row.status === 'open' &&
                  holdsTarget(session?.roles ?? [], row.target_level) &&
                  row.created_by !== userId ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() =>
                          void onResolve(row.id, 'acknowledged', 'Cargo aceite. A pessoa escalada assume o caso.')
                        }
                      >
                        Aceitar o cargo
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() =>
                          void onResolve(
                            row.id,
                            'cancelled',
                            'Cargo recusado. A escalação volta a quem a abriu.',
                          )
                        }
                      >
                        Recusar o cargo
                      </Button>
                    </>
                  ) : null}
                  {row.status === 'acknowledged' ? (
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy}
                      onClick={() => void onResolve(row.id, 'resolved', 'Resolvida na operação')}
                    >
                      Resolver
                    </Button>
                  ) : null}
                  {row.status === 'open' && row.created_by === userId ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => void onResolve(row.id, 'cancelled', 'Anulada por quem abriu.')}
                    >
                      Anular
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
          {!loading && rows.length === 0 ? (
            <li className="py-2 text-sm text-slate-500">Sem escalações recentes.</li>
          ) : null}
        </ul>
      </SoftListSlot>
    </section>
  );
}
