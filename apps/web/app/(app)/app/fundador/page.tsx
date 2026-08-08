import type { Metadata } from 'next';
import { FounderOnboardingClient } from '@/modules/kocc/components/FounderOnboardingClient';

export const metadata: Metadata = {
  title: 'Founder / Owner · Kuteka',
  robots: { index: false, follow: false },
};

export default function FundadorPage() {
  return <FounderOnboardingClient />;
}
