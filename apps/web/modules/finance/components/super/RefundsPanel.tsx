'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FINANCE_REFUND_MODES } from '@kuteka/validation';
import { Badge, Button, Input, Label } from '@kuteka/ui';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../../content';
import {
  createRefund,
  formatAoaAmount,
  listLedgerEntries,
  listRefunds,
  type FinanceLedgerRow,
  type FinanceRefundRow,
} from '../../services/finance-client';
import { Feedback, PanelSection, selectClass, useFeedback, type PanelProps } from './shared';

export function RefundsPanel({ canManage }: PanelProps) {
  const { locale } = useLocale();
  const copy = getFinanceCopy(locale);
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [refunds, setRefunds] = useState<FinanceRefundRow[]>([]);
  const [charges, setCharges] = useState<FinanceLedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ledgerEntryId, setLedgerEntryId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState<(typeof FINANCE_REFUND_MODES)[number]>('credits');

  const load = useCallback(async () => {
    const [refs, led] = await Promise.all([listRefunds(30), listLedgerEntries(50)]);
    if (refs.ok) setRefunds(refs.data);
    if (led.ok) {
      setCharges(led.data.filter((r) => r.entry_type === 'charge' && r.payer_id != null));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy('refund');
    setError(null);
    setMessage(null);
    const res = await createRefund({
      ledgerEntryId,
      amount: Number(amount),
      reason,
      mode,
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(`Reembolso ${String(res.data.status ?? '')} (${mode}).`);
    setLedgerEntryId('');
    setAmount('');
    setReason('');
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />

      {canManage ? (
        <PanelSection
          title={copy.createRefund}
          description="Modo créditos conclui automaticamente via Kuteka Credits + lançamento no ledger."
        >
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="sm:col-span-2">
              <Label htmlFor="r-ledger">Lançamento (cobrança)</Label>
              <select
                id="r-ledger"
                className={selectClass}
                value={ledgerEntryId}
                onChange={(e) => {
                  setLedgerEntryId(e.target.value);
                  const found = charges.find((c) => c.id === e.target.value);
                  if (found && !amount) setAmount(String(found.amount));
                }}
                required
              >
                <option value="">Seleccionar cobrança…</option>
                {charges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.description ?? c.id.slice(0, 8)} ·{' '}
                    {formatAoaAmount(Number(c.amount), c.currency)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="r-amount">Montante (Kz)</Label>
              <Input
                id="r-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="r-mode">Modo</Label>
              <select
                id="r-mode"
                className={selectClass}
                value={mode}
                onChange={(e) => setMode(e.target.value as (typeof FINANCE_REFUND_MODES)[number])}
              >
                {FINANCE_REFUND_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="r-reason">Motivo</Label>
              <Input
                id="r-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" loading={busy === 'refund'}>
                {copy.createRefund}
              </Button>
            </div>
          </form>
        </PanelSection>
      ) : null}

      <SoftListSlot pending={loading && refunds.length === 0}>
        <PanelSection title={copy.sections.refunds}>
          <ul className="divide-y divide-slate-200">
            {refunds.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{r.reason}</p>
                  <p className="text-xs text-slate-500">
                    {r.mode} · {new Date(r.created_at).toLocaleString('pt-PT')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      r.status === 'completed'
                        ? 'success'
                        : r.status === 'rejected' || r.status === 'cancelled'
                          ? 'warning'
                          : 'default'
                    }
                  >
                    {r.status}
                  </Badge>
                  <span className="font-semibold tabular-nums">
                    {formatAoaAmount(Number(r.amount), r.currency)}
                  </span>
                </div>
              </li>
            ))}
            {refunds.length === 0 ? (
              <li className="py-3 text-sm text-slate-500">Sem reembolsos.</li>
            ) : null}
          </ul>
        </PanelSection>
      </SoftListSlot>
    </div>
  );
}
