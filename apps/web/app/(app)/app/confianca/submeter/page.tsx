import type { Metadata } from 'next';
import { TrustSubmitClient } from '@/modules/confianca/components/TrustSubmitClient';

export const metadata: Metadata = {
  title: 'Submeter verificação',
  robots: { index: false, follow: false },
};

export default function ConfiancaSubmeterPage() {
  return <TrustSubmitClient />;
}
