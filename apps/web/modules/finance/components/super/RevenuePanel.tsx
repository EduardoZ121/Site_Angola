'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../../content';
import {
  fetchRevenueSnapshot,
  formatAoaAmount,
  type RevenueSnapshot,
} from '../../services/finance-client';
import { Feedback, Metric, PanelSection } from './shared';

export function RevenuePanel({ onOpen }: { onOpen?: (tab: string) => void }) {
  const { locale } = useLocale();
  const copy = getFinanceCopy(locale);
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
        <PanelSection
          title={copy.sections.revenue}
          description="Cada cartão abre a lista onde essa informação se trata. Não move dinheiro."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label={copy.metrics.captured}
              value={formatAoaAmount(snapshot?.capturedCharges ?? 0)}
              onOpen={onOpen ? () => onOpen('invoices') : undefined}
              href="/app/super?tab=invoices"
            />
            <Metric
              label={copy.metrics.pending}
              value={formatAoaAmount(snapshot?.pendingCharges ?? 0)}
              onOpen={onOpen ? () => onOpen('payengine') : undefined}
              href="/app/super?tab=payengine"
            />
            <Metric
              label={copy.metrics.commissions}
              value={formatAoaAmount(snapshot?.commissions ?? 0)}
              onOpen={onOpen ? () => onOpen('pricing') : undefined}
              href="/app/super?tab=pricing"
            />
            <Metric
              label={copy.metrics.credits}
              value={formatAoaAmount(snapshot?.creditsGranted ?? 0)}
              onOpen={onOpen ? () => onOpen('credits') : undefined}
              href="/app/super?tab=credits"
            />
            <Metric
              label={copy.metrics.refunds}
              value={formatAoaAmount(snapshot?.refunds ?? 0)}
              onOpen={onOpen ? () => onOpen('refunds') : undefined}
              href="/app/super?tab=refunds"
            />
            <Metric
              label={copy.metrics.disputes}
              value={String(snapshot?.openDisputes ?? 0)}
              onOpen={onOpen ? () => onOpen('disputes') : undefined}
              href="/app/super?tab=disputes"
            />
            <Metric
              label={copy.metrics.fraud}
              value={String(snapshot?.openFraud ?? 0)}
              onOpen={onOpen ? () => onOpen('fraud') : undefined}
              href="/app/super?tab=fraud"
            />
            <Metric
              label={copy.metrics.crm}
              value={String(snapshot?.crmAccounts ?? 0)}
              onOpen={onOpen ? () => onOpen('crm') : undefined}
              href="/app/super?tab=crm"
            />
            <Metric
              label={copy.metrics.kai}
              value={String(snapshot?.kaiRules ?? 0)}
              onOpen={onOpen ? () => onOpen('kai') : undefined}
              href="/app/super?tab=kai"
            />
            <Metric
              label={copy.metrics.intents}
              value={String(snapshot?.paymentIntents ?? 0)}
              onOpen={onOpen ? () => onOpen('payengine') : undefined}
              href="/app/super?tab=payengine"
            />
            <Metric
              label={copy.metrics.invoices}
              value={String(snapshot?.invoices ?? 0)}
              onOpen={onOpen ? () => onOpen('invoices') : undefined}
              href="/app/super?tab=invoices"
            />
            <Metric
              label={copy.metrics.products}
              value={String(snapshot?.activeProducts ?? 0)}
              onOpen={onOpen ? () => onOpen('catalog') : undefined}
              href="/app/super?tab=catalog"
            />
            <Metric
              label={copy.metrics.gateways}
              value={String(snapshot?.sandboxGateways ?? 0)}
              onOpen={onOpen ? () => onOpen('gateways') : undefined}
              href="/app/super?tab=gateways"
            />
          </div>
        </PanelSection>
      </SoftListSlot>
    </div>
  );
}
