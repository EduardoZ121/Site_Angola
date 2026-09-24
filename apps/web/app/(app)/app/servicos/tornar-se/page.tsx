import type { Metadata } from 'next';
import { BecomeProviderClient } from '@/modules/monetization/components/BecomeProviderClient';

export const metadata: Metadata = {
  title: 'Tornar-se Prestador',
  robots: { index: false, follow: false },
};

export default function BecomeProviderPage() {
  return <BecomeProviderClient />;
}
