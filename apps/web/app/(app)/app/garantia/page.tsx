import type { Metadata } from 'next';
import { GarantiaClient } from '@/modules/monetization/components/GarantiaClient';

export const metadata: Metadata = {
  title: 'Garantia Kuteka',
  robots: { index: false, follow: false },
};

export default function GarantiaPage() {
  return <GarantiaClient />;
}
