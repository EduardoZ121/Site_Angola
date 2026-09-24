import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProviderCardClient } from '@/modules/monetization/components/ProviderCardClient';

export const metadata: Metadata = {
  title: 'Ficha do Prestador',
  robots: { index: false, follow: false },
};

export default function ProviderCardPage() {
  return (
    <Suspense>
      <ProviderCardClient />
    </Suspense>
  );
}
