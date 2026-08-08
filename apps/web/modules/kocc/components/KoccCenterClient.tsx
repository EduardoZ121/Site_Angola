'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Input } from '@kuteka/ui';
import {
  PanelSection,
  selectClass,
  textareaClass,
  useFeedback,
  Feedback,
} from '@/modules/finance/components/super/shared';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { GO_LIVE_READINESS, goLiveReadinessSummary } from '../lib/go-live-readiness';
import { KOCC_STATUS_OPTIONS, adminStatusLabel, publicStatusLabel } from '../lib/status-labels';
import {
  listAudit,
  listBetaMetrics,
  listFlags,
  parseCsvList,
  upsertFlag,
  type KoccAuditRow,
  type KoccBetaMetrics,
  type KoccFlagRow,
  type KoccUpsertFlagInput,
} from '../services/kocc-client';
import { BetaPanelSection } from './BetaPanelSection';

type PanelProps = {
  canManage: boolean;
};

type FlagDraft = {
  label: string;
  description: string;
  enabled: boolean;
  operationalStatus: KoccUpsertFlagInput['operationalStatus'];
  moduleVersion: string;
  notes: string;
  allowedRoles: string;
  allowedCountries: string;
  environments: string;
};

function toDraft(row: KoccFlagRow): FlagDraft {
  return {
    label: row.label,
    description: row.description ?? '',
    enabled: row.enabled,
    operationalStatus: row.operational_status,
    moduleVersion: row.module_version ?? '',
    notes: row.notes ?? '',
    allowedRoles: (row.allowed_roles ?? []).join(', '),
    allowedCountries: (row.allowed_countries ?? []).join(', '),
    environments: (row.environments ?? []).join(', '),
  };
}

function readinessBadgeVariant(status: string): 'success' | 'warning' | 'default' {
  if (status === 'done') return 'success';
  if (status === 'in_progress') return 'warning';
  return 'default';
}

function readinessLabel(status: string): string {
  if (status === 'done') return 'Concluído';
  if (status === 'in_progress') return 'Em curso';
  return 'Pendente';
}

function auditActionLabel(action: string): string {
  return action === 'create' ? 'Criado' : 'Actualizado';
}

export function KoccCenterClient({ canManage }: PanelProps) {
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [flags, setFlags] = useState<KoccFlagRow[]>([]);
  const [audit, setAudit] = useState<KoccAuditRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, FlagDraft>>({});
  const [loading, setLoading] = useState(true);
  const [betaMetrics, setBetaMetrics] = useState<KoccBetaMetrics | null>(null);
  const [betaLoading, setBetaLoading] = useState(true);
  const [betaError, setBetaError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [flagsRes, auditRes, metricsRes] = await Promise.all([
      listFlags(),
      listAudit(30),
      listBetaMetrics(),
    ]);
    if (flagsRes.ok) {
      setFlags(flagsRes.data);
      setDrafts((prev) => {
        const next: Record<string, FlagDraft> = {};
        for (const row of flagsRes.data) {
          next[row.code] = prev[row.code] ?? toDraft(row);
        }
        return next;
      });
    } else {
      setError(flagsRes.message);
    }
    if (auditRes.ok) setAudit(auditRes.data);
    if (metricsRes.ok) {
      setBetaMetrics(metricsRes.data);
      setBetaError(null);
    } else {
      setBetaMetrics(null);
      setBetaError(metricsRes.message);
    }
    setBetaLoading(false);
    setLoading(false);
  }, [setError]);

  useEffect(() => {
    void load();
  }, [load]);

  const readiness = useMemo(() => goLiveReadinessSummary(GO_LIVE_READINESS), []);

  function updateDraft(code: string, patch: Partial<FlagDraft>) {
    setDrafts((prev) => {
      const current = prev[code] ?? toDraft(flags.find((f) => f.code === code) as KoccFlagRow);
      const next: Record<string, FlagDraft> = { ...prev, [code]: { ...current, ...patch } };
      return next;
    });
  }

  async function onSave(code: string) {
    if (!canManage) return;
    const draft = drafts[code];
    if (!draft) return;
    setBusy(`flag-${code}`);
    setError(null);
    setMessage(null);
    const res = await upsertFlag({
      code,
      label: draft.label,
      description: draft.description || null,
      enabled: draft.enabled,
      operationalStatus: draft.operationalStatus,
      moduleVersion: draft.moduleVersion || null,
      notes: draft.notes || null,
      allowedRoles: parseCsvList(draft.allowedRoles),
      allowedCountries: parseCsvList(draft.allowedCountries),
      environments: parseCsvList(draft.environments),
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(
      `${draft.label} guardado. Estado público: ${publicStatusLabel(draft.operationalStatus)}.`,
    );
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />

      <BetaPanelSection metrics={betaMetrics} loading={betaLoading} loadError={betaError} />

      <PanelSection
        title="Controlo Operacional (KOCC)"
        description="Estado comercial/operacional por módulo. O utilizador final nunca vê o valor interno — apenas a etiqueta pública (Beta, Comercial activo, …)."
      >
        <SoftListSlot pending={loading && flags.length === 0}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Módulo</th>
                  <th className="py-2 pr-3">Estado operacional</th>
                  <th className="py-2 pr-3">Etiqueta pública</th>
                  <th className="py-2 pr-3">Activo (gate)</th>
                  <th className="py-2 pr-3">Versão</th>
                  <th className="py-2 pr-3">Papéis</th>
                  <th className="py-2 pr-3">Países</th>
                  <th className="py-2 pr-3">Ambientes</th>
                  <th className="py-2 pr-3">Notas</th>
                  <th className="py-2 pr-3" />
                </tr>
              </thead>
              <tbody>
                {flags.map((row) => {
                  const draft = drafts[row.code] ?? toDraft(row);
                  return (
                    <tr key={row.code} className="border-b border-slate-100 align-top">
                      <td className="py-3 pr-3">
                        <p className="font-medium text-slate-900">{row.label}</p>
                        <p className="font-mono text-xs text-slate-500">{row.code}</p>
                      </td>
                      <td className="py-3 pr-3">
                        <select
                          className={selectClass}
                          aria-label={`Estado operacional de ${row.label}`}
                          value={draft.operationalStatus}
                          disabled={!canManage}
                          onChange={(e) =>
                            updateDraft(row.code, {
                              operationalStatus: e.target
                                .value as KoccUpsertFlagInput['operationalStatus'],
                            })
                          }
                        >
                          {KOCC_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pr-3">
                        <Badge variant="brand">{publicStatusLabel(draft.operationalStatus)}</Badge>
                      </td>
                      <td className="py-3 pr-3">
                        <label className="flex items-center gap-2 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={draft.enabled}
                            disabled={!canManage}
                            onChange={(e) => updateDraft(row.code, { enabled: e.target.checked })}
                          />
                          {draft.enabled ? 'ON' : 'OFF'}
                        </label>
                      </td>
                      <td className="py-3 pr-3">
                        <Input
                          className="w-28"
                          aria-label={`Versão de ${row.label}`}
                          value={draft.moduleVersion}
                          disabled={!canManage}
                          placeholder="v1.0.0-beta"
                          onChange={(e) => updateDraft(row.code, { moduleVersion: e.target.value })}
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <Input
                          className="w-36"
                          aria-label={`Papéis permitidos para ${row.label}`}
                          value={draft.allowedRoles}
                          disabled={!canManage}
                          placeholder="cliente, agente"
                          onChange={(e) => updateDraft(row.code, { allowedRoles: e.target.value })}
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <Input
                          className="w-24"
                          aria-label={`Países permitidos para ${row.label}`}
                          value={draft.allowedCountries}
                          disabled={!canManage}
                          placeholder="AO"
                          onChange={(e) =>
                            updateDraft(row.code, { allowedCountries: e.target.value })
                          }
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <Input
                          className="w-32"
                          aria-label={`Ambientes de ${row.label}`}
                          value={draft.environments}
                          disabled={!canManage}
                          placeholder="production"
                          onChange={(e) => updateDraft(row.code, { environments: e.target.value })}
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <textarea
                          className={textareaClass + ' min-h-[2.5rem] w-40'}
                          aria-label={`Notas internas de ${row.label}`}
                          value={draft.notes}
                          disabled={!canManage}
                          placeholder="Nota interna"
                          onChange={(e) => updateDraft(row.code, { notes: e.target.value })}
                        />
                      </td>
                      <td className="py-3 pr-3">
                        {canManage ? (
                          <Button
                            type="button"
                            size="sm"
                            loading={busy === `flag-${row.code}`}
                            onClick={() => void onSave(row.code)}
                          >
                            Guardar
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
                {flags.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-4 text-sm text-slate-500">
                      Sem módulos registados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </SoftListSlot>
      </PanelSection>

      <PanelSection
        title="Auditoria recente"
        description="Últimas alterações de estado operacional, com autor e antes/depois."
      >
        <ul className="divide-y divide-slate-200">
          {audit.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {entry.flag_code} · {auditActionLabel(entry.action)}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(entry.created_at).toLocaleString('pt-PT')}
                  {entry.actor_id ? ` · ${entry.actor_id.slice(0, 8)}` : ''}
                </p>
              </div>
              {entry.after_state && typeof entry.after_state.operational_status === 'string' ? (
                <Badge variant="default">
                  {adminStatusLabel(entry.after_state.operational_status as string)}
                </Badge>
              ) : null}
            </li>
          ))}
          {audit.length === 0 ? (
            <li className="py-3 text-sm text-slate-500">Sem alterações registadas.</li>
          ) : null}
        </ul>
      </PanelSection>

      <PanelSection
        title="Go Live Readiness"
        description={`Checklist resumido de preparação para lançamento comercial (${readiness.done}/${readiness.total} concluído).`}
      >
        <ul className="divide-y divide-slate-200">
          {GO_LIVE_READINESS.map((item) => (
            <li key={item.key} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div>
                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                {item.note ? <p className="text-xs text-slate-500">{item.note}</p> : null}
              </div>
              <Badge variant={readinessBadgeVariant(item.status)}>
                {readinessLabel(item.status)}
              </Badge>
            </li>
          ))}
        </ul>
      </PanelSection>
    </div>
  );
}
