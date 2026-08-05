import type { Metadata } from 'next';
import { FinanceHubClient } from '@/modules/finance/components/FinanceHubClient';

export const metadata: Metadata = {
  title: 'Financeiro',
  robots: { index: false, follow: false },
};

export default function FinanceiroPage() {
  return <FinanceHubClient />;
}
