import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProfileIdentityClient } from '@/modules/identidade/components/ProfileIdentityClient';

export const metadata: Metadata = {
  title: 'KIS — Identidade Kuteka',
  robots: { index: false, follow: false },
};

export default function PerfilPage() {
  return (
    <Suspense
      fallback={
        <div className="kuteka-detail-panel p-5 text-sm text-slate-600">A carregar KIS…</div>
      }
    >
      <ProfileIdentityClient />
    </Suspense>
  );
}
