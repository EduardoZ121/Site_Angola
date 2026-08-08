'use client';

import { Badge } from '@kuteka/ui';
import { PanelSection } from '@/modules/finance/components/super/shared';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { publicStatusLabel } from '../lib/status-labels';
import type { KoccBetaMetrics, KoccFeatureUsage } from '../services/kocc-client';

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
};

export function BetaPanelSection({ metrics, loading, loadError }: BetaPanelSectionProps) {
  const merged = mergeUsage(metrics?.featuresMostUsed, metrics?.featureUsageProxy);
  const most = [...merged].sort((a, b) => b.count - a.count).slice(0, 6);
  const least = [...merged].sort((a, b) => a.count - b.count).slice(0, 6);

  return (
    <PanelSection
      title="Painel Beta"
      description="Indicadores em tempo real para decidir quando a Kuteka sai da fase Beta. Inventário de demonstração aparece como Inventário Beta — nunca como «Demo» para o utilizador final."
    >
      {loadError ? <p className="mb-3 text-sm text-amber-800">{loadError}</p> : null}
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
        ) : !loading ? (
          <p className="text-sm text-slate-500">
            Sem métricas. Confirme que a migration <code>0035_kocc_beta_panel.sql</code> foi
            aplicada no Supabase remoto.
          </p>
        ) : null}
      </SoftListSlot>
    </PanelSection>
  );
}
