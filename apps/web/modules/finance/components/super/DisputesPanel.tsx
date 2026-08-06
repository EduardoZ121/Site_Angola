'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Badge, Button, Input, Label } from '@kuteka/ui';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../../content';
import {
  formatAoaAmount,
  listDisputes,
  listLedgerEntries,
  openDispute,
  type FinanceDisputeRow,
  type FinanceLedgerRow,
} from '../../services/finance-client';
import { Feedback, PanelSection, selectClass, useFeedback, type PanelProps } from './shared';

export function DisputesPanel({ canManage }: PanelProps) {
  const { locale } = useLocale();
  const copy = getFinanceCopy(locale);
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [disputes, setDisputes] = useState<FinanceDisputeRow[]>([]);
  const [charges, setCharges] = useState<FinanceLedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ledgerEntryId, setLedgerEntryId] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');

  const load = useCallback(async () => {
    const [dsp, led] = await Promise.all([listDisputes(30), listLedgerEntries(50)]);
    if (dsp.ok) setDisputes(dsp.data);
    if (led.ok) setCharges(led.data.filter((r) => r.entry_type === 'charge' && r.payer_id != null));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy('dispute');
    setError(null);
    setMessage(null);
    const res = await openDispute({
      ledgerEntryId,
      reason,
      amount: amount ? Number(amount) : null,
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(`Disputa ${String(res.data.code ?? '')} aberta.`);
    setLedgerEntryId('');
    setReason('');
    setAmount('');
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />

      {canManage ? (
        <PanelSection
          title={copy.openDispute}
          description="Marca a cobrança como disputada e cria retenção no ledger."
        >
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="sm:col-span-2">
              <Label htmlFor="d-ledger">Lançamento</Label>
              <select
                id="d-ledger"
                className={selectClass}
                value={ledgerEntryId}
                onChange={(e) => setLedgerEntryId(e.target.value)}
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
              <Label htmlFor="d-amount">Montante (opcional)</Label>
              <Input id="d-amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="d-reason">Motivo</Label>
              <Input
                id="d-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" loading={busy === 'dispute'}>
                {copy.openDispute}
              </Button>
            </div>
          </form>
        </PanelSection>
      ) : null}

      <SoftListSlot pending={loading && disputes.length === 0}>
        <PanelSection title={copy.sections.disputes}>
          <ul className="divide-y divide-slate-200">
            {disputes.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{d.reason}</p>
                  <p className="font-mono text-xs text-slate-500">
                    {d.code} · {new Date(d.opened_at).toLocaleString('pt-PT')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      d.status === 'won' || d.status === 'settled'
                        ? 'success'
                        : d.status === 'lost'
                          ? 'warning'
                          : 'default'
                    }
                  >
                    {d.status}
                  </Badge>
                  <span className="font-semibold tabular-nums">
                    {formatAoaAmount(Number(d.amount), d.currency)}
                  </span>
                </div>
              </li>
            ))}
            {disputes.length === 0 ? (
              <li className="py-3 text-sm text-slate-500">Sem disputas.</li>
            ) : null}
          </ul>
        </PanelSection>
      </SoftListSlot>
    </div>
  );
}
