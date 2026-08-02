import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ExploreListClient } from '@/modules/habitacao/components/ExploreListClient';

export const metadata: Metadata = {
  title: 'Explorar habitação',
  robots: { index: false, follow: false },
};

export default function HabitacaoExplorarPage() {
  return (
    <Suspense fallback={<p className="kuteka-detail-meta">A carregar exploração…</p>}>
      <ExploreListClient />
    </Suspense>
  );
}
