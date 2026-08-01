import type { Metadata } from 'next';
import { ContractsHubClient } from '@/modules/contratos/components/ContractsHubClient';

export const metadata: Metadata = {
  title: 'Contratos',
  robots: { index: false, follow: false },
};

export default function ContratosPage() {
  return <ContractsHubClient />;
}
