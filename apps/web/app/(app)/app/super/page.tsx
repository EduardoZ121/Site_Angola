import type { Metadata } from 'next';
import { SuperCommandCenter } from '@/modules/finance/components/SuperCommandCenter';

export const metadata: Metadata = {
  title: 'Super Admin',
  robots: { index: false, follow: false },
};

export default function SuperAdminPage() {
  return <SuperCommandCenter />;
}
