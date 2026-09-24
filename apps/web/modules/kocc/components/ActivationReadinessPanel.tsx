'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Button } from '@kuteka/ui';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import {
  listFeatureFlags,
  setFeatureFlag,
  type FeatureFlagRow,
} from '@/modules/monetization/services/monetization-client';
import { Feedback, PanelSection, useFeedback } from '@/modules/finance/components/super/shared';
import {
  FOUNDER_ACTIVATION_HOLDS,
  adviceLabel,
  adviseFlag,
  type ActivationAdvice,
} from '../lib/activation-readiness';

function adviceVariant(advice: ActivationAdvice): 'success' | 'warning' | 'danger' {
  if (advice === 'ACTIVAR') return 'success';
  if (advice === 'AGUARDAR') return 'warning';
  return 'danger';
}

export function ActivationReadinessPanel({ canManage }: { canManage: boolean }) {
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [flags, setFlags] = useState<FeatureFlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const res = await listFeatureFlags();
    if (res.ok) setFlags(res.data);
    else setError(res.message);
    setLoading(false);
  }, [setError]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onToggle(row: FeatureFlagRow) {
    if (!canManage) return;
    const next = !row.enabled;
    const advice = adviseFlag(row.code, row.enabled);
    if (next && advice.confirmToEnable && !confirmed[row.code]) return;
    setBusy(`flag-${row.code}`);
    setError(null);
    const res = await setFeatureFlag(row.code, next);
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setConfirmed((prev) => ({ ...prev, [row.code]: false }));
    setMessage(`${row.label} → ${next ? 'ligado na Beta' : 'desligado'}`);
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />
      <PanelSection
        title="Pendências que o Founder vê e não se ligam daqui"
        description="A Beta deixa estas decisões visíveis. Não há segundo interruptor: activá-las criaria um sistema duplicado ou um risco que a plataforma ainda não pode assumir."
      >
        <ul className="divide-y divide-slate-200">
          {FOUNDER_ACTIVATION_HOLDS.map((item) => (
            <li key={item.key} className="flex flex-col gap-1 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-900">{item.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs tabular-nums text-slate-500">{item.readiness}%</span>
                  <Badge variant={adviceVariant(item.advice)}>{adviceLabel(item.advice)}</Badge>
                </div>
              </div>
              <p className="text-sm text-slate-600">{item.why}</p>
            </li>
          ))}
        </ul>
      </PanelSection>

      <SoftListSlot pending={loading && flags.length === 0}>
        <PanelSection
          title="Módulos que já existem"
          description="O mesmo registo do Service Health. Ligar ou desligar não faz deploy e não cria um módulo novo. O que está crítico pede confirmação antes de voltar a ligar."
        >
          <ul className="divide-y divide-slate-200">
            {flags.map((row) => {
              const advice = adviseFlag(row.code, row.enabled);
              const needsConfirm = !row.enabled && advice.confirmToEnable;
              const blocked = needsConfirm && !confirmed[row.code];
              return (
                <li key={row.code} className="flex flex-col gap-2 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{row.label}</p>
                      {row.description ? (
                        <p className="text-sm text-slate-600">{row.description}</p>
                      ) : null}
                      <p className="font-mono text-xs text-slate-500">{row.code}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs tabular-nums text-slate-500">
                        {advice.readiness}%
                      </span>
                      <Badge variant={adviceVariant(advice.advice)}>
                        {adviceLabel(advice.advice)}
                      </Badge>
                      <Badge variant={row.enabled ? 'success' : 'warning'}>
                        {row.enabled ? 'Ligado' : 'Desligado'}
                      </Badge>
                      {canManage ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          loading={busy === `flag-${row.code}`}
                          disabled={blocked}
                          onClick={() => void onToggle(row)}
                        >
                          {row.enabled ? 'Desligar' : 'Ligar na Beta'}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {advice.blockers.map((blocker) => (
                    <p key={blocker} className="text-sm text-slate-700">
                      {blocker}
                    </p>
                  ))}
                  {canManage && needsConfirm ? (
                    <label className="flex items-start gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={Boolean(confirmed[row.code])}
                        onChange={(event) =>
                          setConfirmed((prev) => ({ ...prev, [row.code]: event.target.checked }))
                        }
                      />
                      Li o bloqueio. Quero ligar este módulo apenas em modo de teste.
                    </label>
                  ) : null}
                </li>
              );
            })}
            {flags.length === 0 ? (
              <li className="py-3 text-sm text-slate-500">Sem módulos registados.</li>
            ) : null}
          </ul>
        </PanelSection>
      </SoftListSlot>
    </div>
  );
}
