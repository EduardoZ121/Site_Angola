import type { Metadata } from 'next';
import { AccountantCockpitClient } from '@/modules/finance/components/AccountantCockpitClient';

export const metadata: Metadata = {
  title: 'Cockpit do Contabilista',
  robots: { index: false, follow: false },
};

export default function AccountantPage() {
  return <AccountantCockpitClient />;
}
