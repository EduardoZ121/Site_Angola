import type { Metadata } from 'next';
import { TrustReviewClient } from '@/modules/confianca/components/TrustReviewClient';

export const metadata: Metadata = {
  title: 'Revisão de Confiança',
  robots: { index: false, follow: false },
};

export default function ConfiancaRevisaoPage() {
  return <TrustReviewClient />;
}
