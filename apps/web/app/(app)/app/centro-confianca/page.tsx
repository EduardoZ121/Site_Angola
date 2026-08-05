import type { Metadata } from 'next';
import { TrustCenterClient } from '@/modules/identidade/components/TrustCenterClient';

export const metadata: Metadata = {
  title: 'Centro de Confiança Kuteka',
  robots: { index: false, follow: false },
};

export default function CentroConfiancaPage() {
  return <TrustCenterClient />;
}
