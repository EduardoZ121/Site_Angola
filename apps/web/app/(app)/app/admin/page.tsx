import type { Metadata } from 'next';
import { AdminPanelClient } from '@/modules/authentication/components/AdminPanelClient';

export const metadata: Metadata = {
  title: 'Administração',
  robots: { index: false, follow: false },
};

export default function AppAdminPage() {
  return <AdminPanelClient />;
}
