import type { Metadata } from 'next';
import { LegalDeskClient } from '@/modules/finance/components/LegalDeskClient';

export const metadata: Metadata = {
  title: 'Jurídico',
  robots: { index: false, follow: false },
};

export default function JuridicoPage() {
  return <LegalDeskClient />;
}
