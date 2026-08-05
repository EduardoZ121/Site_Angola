'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FINANCE_FRAUD_SEVERITIES, type FinanceFlagFraudInput } from '@kuteka/validation';
import { Badge, Button, Input, Label } from '@kuteka/ui';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../../content/pt';
import {
  flagFraud,
  listFraudFlags,
  resolveFraud,
  type FinanceFraudFlagRow,
} from '../../services/finance-client';
import { Feedback, PanelSection, selectClass, useFeedback, type PanelProps } from './shared';

const ENTITY_TYPES: FinanceFlagFraudInput['entityType'][] = [
  'ledger_entry',
  'payment_intent',
  'user',
  'refund',
  'dispute',
  'service_order',
  'other',
];

export function FraudPanel({ canManage }: PanelProps) {
  const copy = getFinanceCopy();
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [flags, setFlags] = useState<FinanceFraudFlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState<FinanceFlagFraudInput['entityType']>('ledger_entry');
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState<(typeof FINANCE_FRAUD_SEVERITIES)[number]>('medium');

  const load = useCallback(async () => {
    const res = await listFraudFlags(30);
    if (res.ok) setFlags(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy('flag');
    setError(null);
    setMessage(null);
    const res = await flagFraud({ entityType, reason, severity });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(`Sinal ${String(res.data.code ?? '')} registado.`);
    setReason('');
    await load();
  }

  async function onResolve(id: string, status: 'confirmed' | 'dismissed') {
    if (!canManage) return;
    setBusy(`res-${id}`);
    setError(null);
    const res = await resolveFraud({ flagId: id, status });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(`Sinal ${status}.`);
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />

      {canManage ? (
        <PanelSection title={copy.flagFraud} description="Regista um sinal de fraude para revisão.">
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="f-entity">Entidade</Label>
              <select
                id="f-entity"
                className={selectClass}
                value={entityType}
                onChange={(e) =>
                  setEntityType(e.target.value as FinanceFlagFraudInput['entityType'])
                }
              >
                {ENTITY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="f-sev">Severidade</Label>
              <select
                id="f-sev"
                className={selectClass}
                value={severity}
                onChange={(e) =>
                  setSeverity(e.target.value as (typeof FINANCE_FRAUD_SEVERITIES)[number])
                }
              >
                {FINANCE_FRAUD_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="f-reason">Motivo</Label>
              <Input
                id="f-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" loading={busy === 'flag'}>
                {copy.flagFraud}
              </Button>
            </div>
          </form>
        </PanelSection>
      ) : null}

      <SoftListSlot pending={loading && flags.length === 0}>
        <PanelSection title={copy.sections.fraud}>
          <ul className="divide-y divide-slate-200">
            {flags.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{f.reason}</p>
                  <p className="font-mono text-xs text-slate-500">
                    {f.code} · {f.entity_type} · {f.severity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      f.status === 'confirmed'
                        ? 'warning'
                        : f.status === 'dismissed'
                          ? 'default'
                          : 'success'
                    }
                  >
                    {f.status}
                  </Badge>
                  {canManage && (f.status === 'open' || f.status === 'reviewing') ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        loading={busy === `res-${f.id}`}
                        onClick={() => void onResolve(f.id, 'confirmed')}
                      >
                        Confirmar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        loading={busy === `res-${f.id}`}
                        onClick={() => void onResolve(f.id, 'dismissed')}
                      >
                        Descartar
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
            {flags.length === 0 ? (
              <li className="py-3 text-sm text-slate-500">Sem sinais de fraude.</li>
            ) : null}
          </ul>
        </PanelSection>
      </SoftListSlot>
    </div>
  );
}
