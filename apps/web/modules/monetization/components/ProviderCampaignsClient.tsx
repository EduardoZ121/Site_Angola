'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Badge, Button, Heading, Input, Label, Text } from '@kuteka/ui';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { useRoleExperience } from '@/modules/shell/components/RoleExperienceProvider';
import {
  createProviderCampaign,
  formatAoaAmount,
  listCampaigns,
  setCampaignActive,
  type FinanceCampaignRow,
} from '@/modules/finance/services/finance-client';
import { ProviderNetworkNav } from './ProviderNetworkNav';

const FLOW = [
  'Rascunho',
  'KAI (ainda não classifica sozinha)',
  'Análise do Founder',
  'Pagamento bloqueado',
  'Publicada',
  'Relatório',
];

export function ProviderCampaignsClient() {
  const { status, error: sessionError, session } = useAppSession();
  const { mode } = useRoleExperience();
  const canManage =
    mode === 'founder' ||
    mode === 'super_administrator' ||
    Boolean(session?.permissions.includes('finance.manage'));
  const [rows, setRows] = useState<FinanceCampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discount, setDiscount] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listCampaigns();
    if (res.ok) setRows(res.data);
    else setError(res.message);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === 'ready') void load();
  }, [load, status]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setBusy('create');
    setError(null);
    const pct = discount.trim() ? Number(discount) : null;
    if (pct != null && (!Number.isFinite(pct) || pct < 0 || pct > 100)) {
      setBusy(null);
      setError('O desconto, se existir, fica entre 0 e 100. Não é uma comissão.');
      return;
    }
    const res = await createProviderCampaign({ name, description, discountPct: pct });
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setName('');
    setDescription('');
    setDiscount('');
    setMessage('Campanha criada inactiva. Não cobra. O Founder publica quando quiser.');
    await load();
  }

  async function onToggle(row: FinanceCampaignRow) {
    setBusy(row.id);
    setError(null);
    const res = await setCampaignActive(row.id, !row.active);
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(row.active ? 'Campanha retirada.' : 'Campanha publicada na lista existente.');
    await load();
  }

  return (
    <SessionStatusGate status={status} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">Campanhas · mesma tabela do financeiro</p>
          <Heading level={1}>Campanhas</Heading>
          <Text className="mt-1 text-slate-700">
            Créditos e descontos que já existiam, mais ofertas do prestador. Não há um segundo sistema de campanhas e não há cobrança.
          </Text>
          <ol className="mt-4 grid gap-2 sm:grid-cols-3">
            {FLOW.map((step, index) => (
              <li key={step} className="rounded-kuteka border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800">
                {index + 1}. {step}
              </li>
            ))}
          </ol>
          <div className="mt-4">
            <ProviderNetworkNav current="/app/servicos/campanhas" />
          </div>
        </header>

        {message ? (
          <p className="rounded-kuteka border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</p>
        ) : null}
        {error ? (
          <p className="rounded-kuteka border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>
        ) : null}

        {canManage ? (
          <form onSubmit={(event) => void onCreate(event)} className="kuteka-detail-panel grid gap-3 p-5">
            <h2 className="text-sm font-semibold text-slate-900">Nova oferta</h2>
            <div>
              <Label htmlFor="cname">Nome</Label>
              <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} required minLength={3} />
            </div>
            <div>
              <Label htmlFor="cdesc">O que o prestador oferece</Label>
              <textarea
                id="cdesc"
                required
                minLength={8}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-24 w-full rounded-kuteka border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="cdisc">Desconto % (opcional, não é comissão)</Label>
              <Input id="cdisc" inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <Button type="submit" loading={busy === 'create'}>
              Guardar inactiva
            </Button>
          </form>
        ) : (
          <p className="text-sm text-slate-600">
            Criar ou publicar é do Founder. Aqui vê as campanhas já activas.
          </p>
        )}

        <SoftListSlot pending={loading && rows.length === 0}>
          <ul className="divide-y divide-slate-200 rounded-kuteka border border-slate-200 bg-white px-4">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-slate-900">{row.name}</p>
                  <p className="text-sm text-slate-600">{row.description}</p>
                  <p className="font-mono text-xs text-slate-500">
                    {row.code}
                    {row.discount_pct != null ? ` · -${row.discount_pct}%` : ''}
                    {row.credit_grant != null ? ` · créditos ${formatAoaAmount(Number(row.credit_grant))}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={row.active ? 'success' : 'warning'}>{row.active ? 'Publicada' : 'Em análise'}</Badge>
                  {canManage ? (
                    <Button type="button" size="sm" variant="secondary" loading={busy === row.id} onClick={() => void onToggle(row)}>
                      {row.active ? 'Retirar' : 'Publicar'}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
            {rows.length === 0 && !loading ? (
              <li className="py-3 text-sm text-slate-600">Sem campanhas visíveis para esta conta.</li>
            ) : null}
          </ul>
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
