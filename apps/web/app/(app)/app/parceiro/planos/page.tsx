import type { Metadata } from 'next';
import { PartnerPlansClient } from '@/modules/monetization/components/PartnerPlansClient';

export const metadata: Metadata = {
  title: 'Planos Parceiro',
  robots: { index: false, follow: false },
};

export default function PartnerPlansPage() {
  return <PartnerPlansClient />;
}
