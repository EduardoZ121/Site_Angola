'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FINANCE_EXPORT_FORMATS } from '@kuteka/validation';
import { Badge, Button, Input, Label } from '@kuteka/ui';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../../content/pt';
import {
  createAccountingExport,
  formatAoaAmount,
  listAccountingExports,
  type FinanceExportRow,
} from '../../services/finance-client';
import { Feedback, PanelSection, selectClass, useFeedback, type PanelProps } from './shared';

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function downloadText(name: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportPanel({ canManage }: PanelProps) {
  const copy = getFinanceCopy();
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [exports, setExports] = useState<FinanceExportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodStart, setPeriodStart] = useState(isoDate(-30));
  const [periodEnd, setPeriodEnd] = useState(isoDate(0));
  const [format, setFormat] = useState<(typeof FINANCE_EXPORT_FORMATS)[number]>('csv');

  const load = useCallback(async () => {
    const res = await listAccountingExports(20);
    if (res.ok) setExports(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy('export');
    setError(null);
    setMessage(null);
    const res = await createAccountingExport({ periodStart, periodEnd, format });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    const code = String(res.data.code ?? 'export');
    const content = String(res.data.content ?? '');
    const mime = format === 'json' ? 'application/json' : 'text/plain';
    const ext = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'txt';
    downloadText(`${code}.${ext}`, mime, content);
    setMessage(`Exportação ${code} gerada (${String(res.data.rowCount ?? 0)} linhas).`);
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />

      {canManage ? (
        <PanelSection
          title={copy.createExport}
          description="Exporta lançamentos do ledger (base para SAF-T/AGT)."
        >
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="ex-start">Início</Label>
              <Input
                id="ex-start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="ex-end">Fim</Label>
              <Input
                id="ex-end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="ex-format">Formato</Label>
              <select
                id="ex-format"
                className={selectClass}
                value={format}
                onChange={(e) =>
                  setFormat(e.target.value as (typeof FINANCE_EXPORT_FORMATS)[number])
                }
              >
                {FINANCE_EXPORT_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" loading={busy === 'export'}>
                {copy.createExport}
              </Button>
            </div>
          </form>
        </PanelSection>
      ) : null}

      <SoftListSlot pending={loading && exports.length === 0}>
        <PanelSection title={copy.sections.exports}>
          <ul className="divide-y divide-slate-200">
            {exports.map((x) => (
              <li key={x.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-mono text-sm font-medium text-slate-900">{x.code}</p>
                  <p className="text-xs text-slate-500">
                    {x.period_start} → {x.period_end} · {x.format} · {x.row_count} linhas
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={x.status === 'generated' ? 'success' : 'warning'}>
                    {x.status}
                  </Badge>
                  <span className="font-semibold tabular-nums">
                    {formatAoaAmount(Number(x.total_amount))}
                  </span>
                </div>
              </li>
            ))}
            {exports.length === 0 ? (
              <li className="py-3 text-sm text-slate-500">Sem exportações.</li>
            ) : null}
          </ul>
        </PanelSection>
      </SoftListSlot>
    </div>
  );
}
