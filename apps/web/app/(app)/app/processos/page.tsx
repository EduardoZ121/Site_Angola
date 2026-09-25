import type { Metadata } from 'next';
import { ProcessContinuityClient } from '@/modules/shell/components/ProcessContinuityClient';

export const metadata: Metadata = {
  title: 'Processos',
  robots: { index: false, follow: false },
};

export default function ProcessosPage() {
  return <ProcessContinuityClient />;
}
