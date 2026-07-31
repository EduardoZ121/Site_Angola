import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/modules/authentication/components/AuthShell';
import { VerifyPanel } from '@/modules/authentication/components/VerifyPanel';
import { getAuthCopy } from '@/modules/authentication/content';

export const metadata: Metadata = {
  title: 'Verificar email',
  description: 'Confirme o seu email Kuteka.',
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  const copy = getAuthCopy();
  return (
    <AuthShell title={copy.verify.title} subtitle={copy.verify.subtitle}>
      <Suspense fallback={<p className="text-slate-500">{copy.verify.confirming}</p>}>
        <VerifyPanel />
      </Suspense>
    </AuthShell>
  );
}
