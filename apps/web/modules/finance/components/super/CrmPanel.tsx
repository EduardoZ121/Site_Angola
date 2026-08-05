'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FINANCE_CRM_ACCOUNT_TYPES, type FinanceUpsertCrmAccountInput } from '@kuteka/validation';
import { Badge, Button, Input, Label } from '@kuteka/ui';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../../content/pt';
import {
  listCrmAccounts,
  upsertCrmAccount,
  type FinanceCrmAccountRow,
} from '../../services/finance-client';
import { Feedback, PanelSection, selectClass, useFeedback, type PanelProps } from './shared';

export function CrmPanel({ canManage }: PanelProps) {
  const copy = getFinanceCopy();
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [accounts, setAccounts] = useState<FinanceCrmAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] =
    useState<FinanceUpsertCrmAccountInput['accountType']>('partner');
  const [email, setEmail] = useState('');

  const load = useCallback(async () => {
    const res = await listCrmAccounts(60);
    if (res.ok) setAccounts(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    setBusy('crm');
    setError(null);
    setMessage(null);
    const res = await upsertCrmAccount({
      code,
      name,
      accountType,
      contactEmail: email || null,
      status: 'active',
    });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(`Conta ${code} guardada.`);
    setCode('');
    setName('');
    setEmail('');
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />

      {canManage ? (
        <PanelSection
          title={copy.upsertCrm}
          description="CRM financeiro: parceiros, prestadores, empresas e investidores."
        >
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="crm-code">Código</Label>
              <Input
                id="crm-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="crm-name">Nome</Label>
              <Input
                id="crm-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="crm-type">Tipo</Label>
              <select
                id="crm-type"
                className={selectClass}
                value={accountType}
                onChange={(e) =>
                  setAccountType(e.target.value as FinanceUpsertCrmAccountInput['accountType'])
                }
              >
                {FINANCE_CRM_ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="crm-email">Email (opcional)</Label>
              <Input id="crm-email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" loading={busy === 'crm'}>
                {copy.upsertCrm}
              </Button>
            </div>
          </form>
        </PanelSection>
      ) : null}

      <SoftListSlot pending={loading && accounts.length === 0}>
        <PanelSection title={copy.sections.crm}>
          <ul className="divide-y divide-slate-200">
            {accounts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div>
                  <p className="font-medium text-slate-900">{a.name}</p>
                  <p className="font-mono text-xs text-slate-500">
                    {a.code}
                    {a.contact_phone ? ` · ${a.contact_phone}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="default">{a.account_type}</Badge>
                  <Badge variant={a.status === 'active' ? 'success' : 'warning'}>{a.status}</Badge>
                </div>
              </li>
            ))}
            {accounts.length === 0 ? (
              <li className="py-3 text-sm text-slate-500">Sem contas CRM.</li>
            ) : null}
          </ul>
        </PanelSection>
      </SoftListSlot>
    </div>
  );
}
