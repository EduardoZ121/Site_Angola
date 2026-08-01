import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ClientHubClient } from '@/modules/habitacao/components/ClientHubClient';

export const metadata: Metadata = {
  title: 'Habitação',
  robots: { index: false, follow: false },
};

export default function HabitacaoPage() {
  return (
    <Suspense fallback={<p className="kuteka-detail-meta">A carregar Habitação…</p>}>
      <ClientHubClient />
    </Suspense>
  );
}
