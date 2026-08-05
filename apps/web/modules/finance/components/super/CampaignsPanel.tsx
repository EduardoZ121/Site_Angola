'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Button } from '@kuteka/ui';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../../content/pt';
import {
  formatAoaAmount,
  listCampaigns,
  setCampaignActive,
  type FinanceCampaignRow,
} from '../../services/finance-client';
import { Feedback, PanelSection, useFeedback, type PanelProps } from './shared';

export function CampaignsPanel({ canManage }: PanelProps) {
  const copy = getFinanceCopy();
  const { error, setError, message, setMessage, busy, setBusy } = useFeedback();
  const [campaigns, setCampaigns] = useState<FinanceCampaignRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await listCampaigns();
    if (res.ok) setCampaigns(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onToggle(id: string, active: boolean) {
    if (!canManage) return;
    setBusy(`camp-${id}`);
    setError(null);
    const res = await setCampaignActive(id, active);
    setBusy(null);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setMessage(`Campanha ${active ? 'activada' : 'desactivada'}.`);
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} message={message} />
      <SoftListSlot pending={loading && campaigns.length === 0}>
        <PanelSection
          title={copy.sections.campaigns}
          description="Créditos e descontos configuráveis (B2B2C)."
        >
          <ul className="divide-y divide-slate-200">
            {campaigns.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-slate-900">{c.name}</p>
                  <p className="text-sm text-slate-600">{c.description}</p>
                  <p className="font-mono text-xs text-slate-500">
                    {c.code}
                    {c.credit_grant != null
                      ? ` · créditos ${formatAoaAmount(Number(c.credit_grant))}`
                      : ''}
                    {c.discount_pct != null ? ` · -${c.discount_pct}%` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.active ? 'success' : 'warning'}>
                    {c.active ? 'Activa' : 'Off'}
                  </Badge>
                  {canManage ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      loading={busy === `camp-${c.id}`}
                      onClick={() => void onToggle(c.id, !c.active)}
                    >
                      {c.active ? 'Desactivar' : 'Activar'}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
            {campaigns.length === 0 ? (
              <li className="py-3 text-sm text-slate-500">Sem campanhas.</li>
            ) : null}
          </ul>
        </PanelSection>
      </SoftListSlot>
    </div>
  );
}
