import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FindProviderClient } from '@/modules/monetization/components/FindProviderClient';

export const metadata: Metadata = {
  title: 'Encontrar Prestador',
  robots: { index: false, follow: false },
};

export default function FindProviderPage() {
  return (
    <Suspense>
      <FindProviderClient />
    </Suspense>
  );
}
