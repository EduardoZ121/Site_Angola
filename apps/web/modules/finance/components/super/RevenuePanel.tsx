'use client';

import { useEffect, useState } from 'react';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../../content/pt';
import {
  fetchRevenueSnapshot,
  formatAoaAmount,
  type RevenueSnapshot,
} from '../../services/finance-client';
import { Feedback, Metric, PanelSection } from './shared';

export function RevenuePanel() {
  const copy = getFinanceCopy();
  const [snapshot, setSnapshot] = useState<RevenueSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const snap = await fetchRevenueSnapshot();
      if (!active) return;
      if (snap.ok) setSnapshot(snap.data);
      else setError(snap.message);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Feedback error={error} />
      <SoftListSlot pending={loading && !snapshot}>
        <PanelSection title={copy.sections.revenue}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label={copy.metrics.captured}
              value={formatAoaAmount(snapshot?.capturedCharges ?? 0)}
            />
            <Metric
              label={copy.metrics.pending}
              value={formatAoaAmount(snapshot?.pendingCharges ?? 0)}
            />
            <Metric
              label={copy.metrics.commissions}
              value={formatAoaAmount(snapshot?.commissions ?? 0)}
            />
            <Metric
              label={copy.metrics.credits}
              value={formatAoaAmount(snapshot?.creditsGranted ?? 0)}
            />
            <Metric label={copy.metrics.refunds} value={formatAoaAmount(snapshot?.refunds ?? 0)} />
            <Metric label={copy.metrics.disputes} value={String(snapshot?.openDisputes ?? 0)} />
            <Metric label={copy.metrics.fraud} value={String(snapshot?.openFraud ?? 0)} />
            <Metric label={copy.metrics.crm} value={String(snapshot?.crmAccounts ?? 0)} />
            <Metric label={copy.metrics.kai} value={String(snapshot?.kaiRules ?? 0)} />
            <Metric label={copy.metrics.intents} value={String(snapshot?.paymentIntents ?? 0)} />
            <Metric label={copy.metrics.invoices} value={String(snapshot?.invoices ?? 0)} />
            <Metric label={copy.metrics.products} value={String(snapshot?.activeProducts ?? 0)} />
            <Metric label={copy.metrics.gateways} value={String(snapshot?.sandboxGateways ?? 0)} />
          </div>
        </PanelSection>
      </SoftListSlot>
    </div>
  );
}
