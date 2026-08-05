import type { Metadata } from 'next';
import { MarketplaceClient } from '@/modules/monetization/components/MarketplaceClient';

export const metadata: Metadata = {
  title: 'Prestadores de Serviços',
  robots: { index: false, follow: false },
};

export default function ServicosPage() {
  return <MarketplaceClient />;
}
