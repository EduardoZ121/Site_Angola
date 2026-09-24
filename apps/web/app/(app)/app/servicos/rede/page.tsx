import type { Metadata } from 'next';
import { ProviderNetworkHub } from '@/modules/monetization/components/ProviderNetworkHub';

export const metadata: Metadata = {
  title: 'Rede de Prestadores',
  robots: { index: false, follow: false },
};

export default function ProviderNetworkPage() {
  return <ProviderNetworkHub />;
}
