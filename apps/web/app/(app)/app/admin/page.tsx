import type { Metadata } from 'next';
import { AdminHubClient } from '@/modules/administracao/components/AdminHubClient';

export const metadata: Metadata = {
  title: 'Administração',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminHubClient />;
}
