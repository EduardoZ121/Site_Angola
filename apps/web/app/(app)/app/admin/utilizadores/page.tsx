import type { Metadata } from 'next';
import { AdminUsersClient } from '@/modules/administracao/components/AdminUsersClient';

export const metadata: Metadata = {
  title: 'Utilizadores',
  robots: { index: false, follow: false },
};

export default function AdminUtilizadoresPage() {
  return <AdminUsersClient />;
}
