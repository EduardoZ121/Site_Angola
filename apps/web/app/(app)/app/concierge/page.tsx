import type { Metadata } from 'next';
import { ConciergeClient } from '@/modules/monetization/components/ConciergeClient';

export const metadata: Metadata = {
  title: 'Concierge Kuteka',
  robots: { index: false, follow: false },
};

export default function ConciergePage() {
  return <ConciergeClient />;
}
