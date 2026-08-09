'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Heading, Text } from '@kuteka/ui';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
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
  const [rows, setRows] = useState<OperationalEscalation[]>([]);
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
    setTarget(defaultTarget(mode));
  }, [mode]);

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

  async function onResolve(id: string, status: 'acknowledged' | 'resolved' | 'cancelled') {
    setBusy(true);
    setError(null);
    const result = await resolveOperationalEscalation({
      escalationId: id,
      status,
      resolutionNotes:
        status === 'acknowledged'
          ? 'Assumida pelo responsável'
          : status === 'resolved'
            ? 'Resolvida na operação'
            : 'Cancelada',
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(`Escalação marcada como ${status}.`);
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
          Supervisor → Admin → Super Admin → Founder · motivo, prioridade, prazo, estado e
          auditoria. Abertas: {openCount}.
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
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
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
                    {row.status}
                  </Badge>
                </div>
              </div>
              {(row.status === 'open' || row.status === 'acknowledged') && (
                <div className="flex flex-wrap gap-2">
                  {row.status === 'open' ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void onResolve(row.id, 'acknowledged')}
                    >
                      Assumir
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => void onResolve(row.id, 'resolved')}
                  >
                    Resolver
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void onResolve(row.id, 'cancelled')}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
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
