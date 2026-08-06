'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { Button, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { ForbiddenPanel } from '@/modules/shell/components/ForbiddenPanel';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getFinanceCopy } from '../content';
import { RevenuePanel } from './super/RevenuePanel';
import { CatalogPanel } from './super/CatalogPanel';
import { PricingPanel } from './super/PricingPanel';
import { CreditsPanel } from './super/CreditsPanel';
import { RefundsPanel } from './super/RefundsPanel';
import { DisputesPanel } from './super/DisputesPanel';
import { ReconPanel } from './super/ReconPanel';
import { FraudPanel } from './super/FraudPanel';
import { KaiRulesPanel } from './super/KaiRulesPanel';
import { CrmPanel } from './super/CrmPanel';
import { ExportPanel } from './super/ExportPanel';
import { InvoicesPanel } from './super/InvoicesPanel';
import { PayEnginePanel } from './super/PayEnginePanel';
import { GatewaysPanel } from './super/GatewaysPanel';
import { FeatureFlagsPanel } from './super/FeatureFlagsPanel';
import { CampaignsPanel } from './super/CampaignsPanel';
import { KoccCenterClient } from '@/modules/kocc/components/KoccCenterClient';

type TabKey =
  | 'revenue'
  | 'catalog'
  | 'pricing'
  | 'credits'
  | 'refunds'
  | 'disputes'
  | 'recon'
  | 'fraud'
  | 'kai'
  | 'crm'
  | 'exports'
  | 'invoices'
  | 'payengine'
  | 'gateways'
  | 'flags'
  | 'campaigns'
  | 'kocc';

export function SuperCommandCenter() {
  const { locale } = useLocale();
  const copy = getFinanceCopy(locale);
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const canManage = sessionStatus === 'ready' && !!session?.permissions.includes('finance.manage');
  const canRead =
    sessionStatus === 'ready' &&
    (!!session?.permissions.includes('finance.read') ||
      !!session?.permissions.includes('finance.manage'));
  const accessPending = sessionStatus === 'loading';
  const denied = sessionStatus === 'ready' && !canRead;

  const [tab, setTab] = useState<TabKey>('revenue');

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'revenue', label: copy.tabs.revenue },
    { key: 'catalog', label: copy.tabs.catalog },
    { key: 'pricing', label: copy.tabs.pricing },
    { key: 'credits', label: copy.tabs.credits },
    { key: 'refunds', label: copy.tabs.refunds },
    { key: 'disputes', label: copy.tabs.disputes },
    { key: 'recon', label: copy.tabs.recon },
    { key: 'fraud', label: copy.tabs.fraud },
    { key: 'kai', label: copy.tabs.kai },
    { key: 'crm', label: copy.tabs.crm },
    { key: 'exports', label: copy.tabs.exports },
    { key: 'invoices', label: copy.tabs.invoices },
    { key: 'payengine', label: copy.tabs.payengine },
    { key: 'gateways', label: copy.tabs.gateways },
    { key: 'flags', label: copy.tabs.flags },
    { key: 'campaigns', label: copy.tabs.campaigns },
    { key: 'kocc', label: copy.tabs.kocc },
  ];

  const panels: Record<TabKey, ReactNode> = {
    revenue: <RevenuePanel />,
    catalog: <CatalogPanel canManage={canManage} />,
    pricing: <PricingPanel canManage={canManage} />,
    credits: <CreditsPanel canManage={canManage} />,
    refunds: <RefundsPanel canManage={canManage} />,
    disputes: <DisputesPanel canManage={canManage} />,
    recon: <ReconPanel canManage={canManage} />,
    fraud: <FraudPanel canManage={canManage} />,
    kai: <KaiRulesPanel canManage={canManage} />,
    crm: <CrmPanel canManage={canManage} />,
    exports: <ExportPanel canManage={canManage} />,
    invoices: <InvoicesPanel canManage={canManage} />,
    payengine: <PayEnginePanel canManage={canManage} />,
    gateways: <GatewaysPanel canManage={canManage} />,
    flags: <FeatureFlagsPanel canManage={canManage} />,
    campaigns: <CampaignsPanel canManage={canManage} />,
    kocc: <KoccCenterClient canManage={canManage} />,
  };

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">{copy.eyebrow}</p>
          <Heading level={1}>{copy.superTitle}</Heading>
          <Text className="mt-1 text-slate-700">{copy.superSubtitle}</Text>
          <p className="kuteka-detail-meta mt-2">{copy.custodyNote}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/app/admin" className={cn(buttonVariants({ variant: 'secondary' }))}>
              Admin operacional
            </Link>
            <Link href="/app/mudanca" className={cn(buttonVariants({ variant: 'ghost' }))}>
              Mudança Inteligente
            </Link>
            <Link href="/app/servicos" className={cn(buttonVariants({ variant: 'ghost' }))}>
              Prestadores
            </Link>
            <Link href="/app/parceiro/planos" className={cn(buttonVariants({ variant: 'ghost' }))}>
              Planos Parceiro
            </Link>
            <a
              href="https://github.com/EduardoZ121/Site_Angola/blob/main/docs/finance/ARQUITETURA_FINANCEIRA_KUTEKA.md"
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: 'ghost' }))}
            >
              Arquitectura financeira
            </a>
          </div>
        </header>

        {accessPending ? <SoftListSlot pending /> : null}
        {denied ? <ForbiddenPanel message={copy.forbidden} /> : null}

        {canRead ? (
          <>
            <nav
              className="kuteka-detail-panel flex flex-wrap gap-2 p-3"
              aria-label="Secções do Centro de Comando"
            >
              {tabs.map((t) => (
                <Button
                  key={t.key}
                  type="button"
                  size="sm"
                  variant={tab === t.key ? 'primary' : 'ghost'}
                  aria-pressed={tab === t.key}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                </Button>
              ))}
            </nav>
            {panels[tab]}
          </>
        ) : null}
      </div>
    </SessionStatusGate>
  );
}
