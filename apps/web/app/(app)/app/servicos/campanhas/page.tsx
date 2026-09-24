import type { Metadata } from 'next';
import { ProviderCampaignsClient } from '@/modules/monetization/components/ProviderCampaignsClient';

export const metadata: Metadata = {
  title: 'Campanhas',
  robots: { index: false, follow: false },
};

export default function ProviderCampaignsPage() {
  return <ProviderCampaignsClient />;
}
