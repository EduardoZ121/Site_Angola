'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Badge, Button, Input, Label } from '@kuteka/ui';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../../content';
import {
  formatAoaAmount,
  listReconciliationRuns,
  runReconciliation,
  type FinanceReconRunRow,
} from '../../services/finance-client';
import { Feedback, PanelSection, useFeedback, type PanelProps } from './shared';

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function ReconPanel({ canManage }: PanelProps) {
  const { locale } = useLocale();
  const copy = getFinanceCopy(locale);
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [runs, setRuns] = useState<FinanceReconRunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodStart, setPeriodStart] = useState(isoDate(-30));
  const [periodEnd, setPeriodEnd] = useState(isoDate(0));
  const [gatewayCode, setGatewayCode] = useState('');

  const load = useCallback(async () => {
    const res = await listReconciliationRuns(20);
    if (res.ok) setRuns(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy('recon');
    setError(null);
    setMessage(null);
    const res = await runReconciliation({
      periodStart,
      periodEnd,
      gatewayCode: gatewayCode || null,
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(
      `Reconciliação: ${String(res.data.matched ?? 0)} conciliados, ${String(res.data.unmatched ?? 0)} por conciliar.`,
    );
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />

      {canManage ? (
        <PanelSection
          title={copy.runRecon}
          description="Compara o ledger com as referências dos gateways no período."
        >
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="rec-start">Início</Label>
              <Input
                id="rec-start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="rec-end">Fim</Label>
              <Input
                id="rec-end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="rec-gw">Gateway (opcional)</Label>
              <Input
                id="rec-gw"
                value={gatewayCode}
                onChange={(e) => setGatewayCode(e.target.value)}
                placeholder="sandbox"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" loading={busy === 'recon'}>
                {copy.runRecon}
              </Button>
            </div>
          </form>
        </PanelSection>
      ) : null}

      <SoftListSlot pending={loading && runs.length === 0}>
        <PanelSection title={copy.sections.recon}>
          <ul className="divide-y divide-slate-200">
            {runs.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-mono text-sm font-medium text-slate-900">{r.code}</p>
                  <p className="text-xs text-slate-500">
                    {r.period_start} → {r.period_end}
                    {r.gateway_code ? ` · ${r.gateway_code}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">{r.matched_count} ✓</Badge>
                  <Badge variant={r.unmatched_count > 0 ? 'warning' : 'default'}>
                    {r.unmatched_count} ⚠
                  </Badge>
                  <span className="font-semibold tabular-nums">
                    {formatAoaAmount(Number(r.total_amount))}
                  </span>
                </div>
              </li>
            ))}
            {runs.length === 0 ? (
              <li className="py-3 text-sm text-slate-500">Sem reconciliações.</li>
            ) : null}
          </ul>
        </PanelSection>
      </SoftListSlot>
    </div>
  );
}
