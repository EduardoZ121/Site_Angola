import type { Metadata } from 'next';
import { FounderCenterClient } from '@/modules/kocc/components/FounderCenterClient';

export const metadata: Metadata = {
  title: 'Founder Center · Kuteka',
  robots: { index: false, follow: false },
};

export default function FundadorPage() {
  return <FounderCenterClient />;
}
