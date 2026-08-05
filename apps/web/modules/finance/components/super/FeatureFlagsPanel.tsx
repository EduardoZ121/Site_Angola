'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Button } from '@kuteka/ui';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import {
  listFeatureFlags,
  setFeatureFlag,
  type FeatureFlagRow,
} from '@/modules/monetization/services/monetization-client';
import { Feedback, PanelSection, useFeedback, type PanelProps } from './shared';

export function FeatureFlagsPanel({ canManage }: PanelProps) {
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [flags, setFlags] = useState<FeatureFlagRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await listFeatureFlags();
    if (res.ok) setFlags(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onToggle(code: string, enabled: boolean) {
    if (!canManage) return;
    setBusy(`flag-${code}`);
    setError(null);
    const res = await setFeatureFlag(code, enabled);
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(`Flag ${code} → ${enabled ? 'ON' : 'OFF'}`);
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />
      <SoftListSlot pending={loading && flags.length === 0}>
        <PanelSection
          title="Service Health"
          description="Ligar / desligar módulos comerciais sem deploy."
        >
          <ul className="divide-y divide-slate-200">
            {flags.map((f) => (
              <li key={f.code} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-slate-900">{f.label}</p>
                  <p className="text-sm text-slate-600">{f.description}</p>
                  <p className="font-mono text-xs text-slate-500">{f.code}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={f.enabled ? 'success' : 'warning'}>
                    {f.enabled ? 'ON' : 'OFF'}
                  </Badge>
                  {canManage ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      loading={busy === `flag-${f.code}`}
                      onClick={() => void onToggle(f.code, !f.enabled)}
                    >
                      {f.enabled ? 'Desligar' : 'Ligar'}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
            {flags.length === 0 ? (
              <li className="py-3 text-sm text-slate-500">Sem flags.</li>
            ) : null}
          </ul>
        </PanelSection>
      </SoftListSlot>
    </div>
  );
}
