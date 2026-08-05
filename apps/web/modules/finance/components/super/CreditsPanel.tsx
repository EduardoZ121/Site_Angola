'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Badge, Button, Input, Label } from '@kuteka/ui';
import { createBrowserClient } from '@/lib/supabase/client';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../../content/pt';
import {
  formatAoaAmount,
  grantCredits,
  listLedgerEntries,
  type FinanceLedgerRow,
} from '../../services/finance-client';
import { Feedback, PanelSection, useFeedback, type PanelProps } from './shared';

export function CreditsPanel({ canManage }: PanelProps) {
  const copy = getFinanceCopy();
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [creditUserId, setCreditUserId] = useState('');
  const [creditAmount, setCreditAmount] = useState('2000');
  const [ledger, setLedger] = useState<FinanceLedgerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const led = await listLedgerEntries(40);
    if (led.ok) {
      setLedger(led.data.filter((r) => ['credit_grant', 'credit_redeem'].includes(r.entry_type)));
    }
    const {
      data: { user },
    } = await createBrowserClient().auth.getUser();
    if (user?.id) setCreditUserId((prev) => prev || user.id);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onGrant(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy('grant');
    setError(null);
    setMessage(null);
    const res = await grantCredits({
      userId: creditUserId,
      amount: Number(creditAmount),
      reason: 'Concessão Super Admin',
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(`Créditos concedidos. Saldo: ${String(res.data.balance ?? '—')}`);
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />

      {canManage ? (
        <PanelSection
          title={copy.sections.credits}
          description="Concede Kuteka Credits a qualquer utilizador."
        >
          <form className="grid gap-3 sm:grid-cols-3" onSubmit={onGrant}>
            <div className="sm:col-span-2">
              <Label htmlFor="creditUser">User ID</Label>
              <Input
                id="creditUser"
                value={creditUserId}
                onChange={(e) => setCreditUserId(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="creditAmount">Montante (Kz)</Label>
              <Input
                id="creditAmount"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" loading={busy === 'grant'}>
                {copy.grantCredits}
              </Button>
            </div>
          </form>
        </PanelSection>
      ) : null}

      <SoftListSlot pending={loading && ledger.length === 0}>
        <PanelSection title="Movimentos de créditos">
          <ul className="divide-y divide-slate-200">
            {ledger.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {row.entry_type} · {row.description ?? '—'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(row.created_at).toLocaleString('pt-PT')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={row.status === 'captured' ? 'success' : 'warning'}>
                    {row.status}
                  </Badge>
                  <span className="font-semibold tabular-nums">
                    {formatAoaAmount(Number(row.amount), row.currency)}
                  </span>
                </div>
              </li>
            ))}
            {ledger.length === 0 ? (
              <li className="py-3 text-sm text-slate-500">Sem movimentos de créditos.</li>
            ) : null}
          </ul>
        </PanelSection>
      </SoftListSlot>
    </div>
  );
}
