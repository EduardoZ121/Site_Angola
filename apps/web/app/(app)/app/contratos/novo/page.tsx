import type { Metadata } from 'next';
import { CreateContractForm } from '@/modules/contratos/components/CreateContractForm';

export const metadata: Metadata = {
  title: 'Preparar contrato',
  robots: { index: false, follow: false },
};

export default function ContratosNovoPage() {
  return <CreateContractForm />;
}
