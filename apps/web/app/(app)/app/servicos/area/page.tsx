import type { Metadata } from 'next';
import { ProviderAreaClient } from '@/modules/monetization/components/ProviderAreaClient';

export const metadata: Metadata = {
  title: 'Área do Prestador',
  robots: { index: false, follow: false },
};

export default function ProviderAreaPage() {
  return <ProviderAreaClient />;
}
