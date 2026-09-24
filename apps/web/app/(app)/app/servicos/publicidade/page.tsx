import type { Metadata } from 'next';
import { ProviderAdsClient } from '@/modules/monetization/components/ProviderAdsClient';

export const metadata: Metadata = {
  title: 'Publicidade de Prestadores',
  robots: { index: false, follow: false },
};

export default function ProviderAdsPage() {
  return <ProviderAdsClient />;
}
