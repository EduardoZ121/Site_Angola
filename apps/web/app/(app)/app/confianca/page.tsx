import type { Metadata } from 'next';
import { TrustHubClient } from '@/modules/confianca/components/TrustHubClient';

export const metadata: Metadata = {
  title: 'Confiança',
  robots: { index: false, follow: false },
};

export default function ConfiancaPage() {
  return <TrustHubClient />;
}
