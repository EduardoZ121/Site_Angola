'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@kuteka/ui';
import { PanelSection } from '@/modules/finance/components/super/shared';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { filterBetaInboxRows, type BetaInboxFilter } from '../lib/beta-feedback-inbox';
import { shouldShowSoftEmpty } from '../lib/soft-empty-gate';
import { publicStatusLabel } from '../lib/status-labels';
import {
  updateBetaFeedbackStatus,
  type KoccBetaFeedbackRow,
  type KoccBetaMetrics,
  type KoccFeatureUsage,
} from '../services/kocc-client';
import { BetaFeedbackInboxItem } from './BetaFeedbackInboxItem';

function MetricCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="kuteka-detail-fact p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function FeatureList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: KoccFeatureUsage[];
  empty: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <ul className="mt-2 divide-y divide-slate-100">
        {rows.length === 0 ? (
          <li className="py-2 text-sm text-slate-500">{empty}</li>
        ) : (
          rows.map((row) => (
            <li key={row.code} className="flex items-center justify-between gap-2 py-1.5 text-sm">
              <span className="text-slate-800">{row.label}</span>
              <span className="font-mono text-xs text-slate-500">{row.count}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function mergeUsage(
  tracked: KoccFeatureUsage[] | undefined,
  proxy: KoccFeatureUsage[] | undefined,
): KoccFeatureUsage[] {
  const map = new Map<string, KoccFeatureUsage>();
  for (const row of proxy ?? []) {
    map.set(row.code, { ...row, count: Number(row.count) || 0 });
  }
  for (const row of tracked ?? []) {
    const prev = map.get(row.code);
    const count = Math.max(Number(row.count) || 0, prev?.count ?? 0);
    map.set(row.code, {
      code: row.code,
      label: row.label || prev?.label || row.code,
      count,
    });
  }
  return Array.from(map.values());
}

type BetaPanelSectionProps = {
  metrics: KoccBetaMetrics | null;
  loading: boolean;
  loadError: string | null;
  inbox?: KoccBetaFeedbackRow[];
  inboxLoading?: boolean;
  inboxError?: string | null;
  onInboxChange?: (rows: KoccBetaFeedbackRow[]) => void;
};

export function BetaPanelSection({
  metrics,
  loading,
  loadError,
  inbox = [],
  inboxLoading = false,
  inboxError = null,
  onInboxChange,
}: BetaPanelSectionProps) {
  const [inboxFilter, setInboxFilter] = useState<BetaInboxFilter>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const merged = mergeUsage(metrics?.featuresMostUsed, metrics?.featureUsageProxy);
  const most = [...merged].sort((a, b) => b.count - a.count).slice(0, 6);
  const least = [...merged].sort((a, b) => a.count - b.count).slice(0, 6);
  const filteredInbox = useMemo(
    () => filterBetaInboxRows(inbox, inboxFilter),
    [inbox, inboxFilter],
  );

  async function onStatusChange(id: string, status: string, resolutionNotes?: string | null) {
    setUpdatingId(id);
    setStatusError(null);
    const res = await updateBetaFeedbackStatus({ id, status, resolutionNotes });
    setUpdatingId(null);
    if (!res.ok) {
      setStatusError(res.message);
      return;
    }
    const next = inbox.map((row) => (row.id === id ? { ...row, ...res.data } : row));
    onInboxChange?.(next);
  }

  return (
    <PanelSection
      title="Painel Beta"
      description="Indicadores em tempo real para decidir quando a Kuteka sai da fase Beta. Inventário de demonstração aparece como Inventário Beta — nunca como «Demo» para o utilizador final."
    >
      {loadError ? <p className="mb-3 text-sm text-amber-800">{loadError}</p> : null}
      <div className="flex flex-col gap-4">
        <SoftListSlot pending={loading && !metrics}>
          {metrics ? (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-slate-500">
                Actualizado:{' '}
                {new Date(metrics.generatedAt).toLocaleString('pt-AO', {
                  dateStyle: 'short',
                  timeStyle: 'medium',
                })}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <MetricCard label="Utilizadores Beta" value={String(metrics.betaUsers)} />
                <MetricCard
                  label="Patrimónios reais"
                  value={String(metrics.propertiesReal)}
                  hint={`Inventário Beta: ${metrics.propertiesBetaInventory}`}
                />
                <MetricCard
                  label="Visitas em acompanhamento"
                  value={String(metrics.visitsScheduled)}
                  hint="Interesses activos (proxy de visitas)"
                />
                <MetricCard
                  label="Contratos iniciados"
                  value={String(metrics.contractsStarted)}
                  hint="Reais · rascunho / pendente / activo"
                />
                <MetricCard label="Feedback recebido" value={String(metrics.feedbackReceived)} />
                <MetricCard label="Bugs reportados" value={String(metrics.bugsReported)} />
                <MetricCard
                  label="Onboarding concluído"
                  value={`${metrics.onboardingCompletionRate}%`}
                  hint="Contas com pelo menos um papel"
                />
                <MetricCard label="KIS / KYC (≥ nível 2)" value={`${metrics.kisCompletionRate}%`} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FeatureList
                  title="Funcionalidades mais utilizadas"
                  rows={most}
                  empty="Ainda sem eventos de utilização."
                />
                <FeatureList
                  title="Funcionalidades menos utilizadas"
                  rows={least}
                  empty="Ainda sem eventos de utilização."
                />
              </div>

              {(metrics.modulesOperational?.length ?? 0) > 0 ? (
                <div>
                  <p className="text-sm font-semibold text-slate-900">Estado dos módulos</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {metrics.modulesOperational.map((mod) => (
                      <li key={mod.code}>
                        <Badge variant={mod.enabled ? 'brand' : 'default'}>
                          {mod.label}: {publicStatusLabel(mod.status)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : shouldShowSoftEmpty({
              pending: loading,
              hasItems: Boolean(metrics),
              hasError: Boolean(loadError),
            }) ? (
            <p className="text-sm text-slate-500">
              Sem métricas. Confirme que a migration <code>0035_kocc_beta_panel.sql</code> foi
              aplicada no Supabase remoto e que a conta tem <code>finance.manage</code> ou é
              Founder.
            </p>
          ) : null}
        </SoftListSlot>

        <div>
          <p className="text-sm font-semibold text-slate-900">Inbox de triagem Beta</p>
          <p className="mt-1 text-xs text-slate-500">
            Relatos recentes de <code>/app/ajuda</code> (tabela <code>beta_feedback</code>, RLS
            operacional + Founder). O contexto (idioma, ecrã, caminho) aparece no cartão. A nota
            interna fica só na operação — o autor não é notificado. Sem screenshots.
          </p>
          {inboxError ? <p className="mt-2 text-sm text-amber-800">{inboxError}</p> : null}
          {statusError ? <p className="mt-2 text-sm text-amber-800">{statusError}</p> : null}
          {inbox.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {(
                [
                  ['all', 'Todos'],
                  ['open', 'Abertos'],
                  ['bug', 'Bugs'],
                  ['feedback', 'Sugestões'],
                  ['avaliacao', 'Avaliações'],
                  ['reclamacao', 'Reclamações'],
                  ['resolvido', 'Fechados'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    inboxFilter === value
                      ? 'rounded border border-slate-800 bg-slate-900 px-2 py-1 text-white'
                      : 'rounded border border-slate-200 bg-white px-2 py-1 text-slate-700'
                  }
                  onClick={() => setInboxFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          <SoftListSlot pending={inboxLoading && inbox.length === 0}>
            {shouldShowSoftEmpty({
              pending: inboxLoading,
              hasItems: inbox.length > 0,
              hasError: Boolean(inboxError),
            }) ? (
              <p className="mt-2 text-sm text-slate-500">Ainda sem relatos na inbox.</p>
            ) : null}
            {inbox.length > 0 && filteredInbox.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Nenhum relato neste filtro.</p>
            ) : null}
            {filteredInbox.length > 0 ? (
              <ul className="mt-2 divide-y divide-slate-100">
                {filteredInbox.map((row) => (
                  <BetaFeedbackInboxItem
                    key={row.id}
                    row={row}
                    busy={updatingId === row.id}
                    canEdit={Boolean(onInboxChange)}
                    onSave={({ status, resolutionNotes }) =>
                      void onStatusChange(row.id, status, resolutionNotes)
                    }
                  />
                ))}
              </ul>
            ) : null}
          </SoftListSlot>
        </div>
      </div>
    </PanelSection>
  );
}
