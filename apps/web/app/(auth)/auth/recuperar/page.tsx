import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/modules/authentication/components/AuthShell';
import { RecoverRequestForm } from '@/modules/authentication/components/RecoverRequestForm';
import { getAuthCopy } from '@/modules/authentication/content';

export const metadata: Metadata = {
  title: 'Recuperar acesso',
  description: 'Recupere o acesso à sua conta Kuteka.',
  robots: { index: false, follow: false },
};

export default function RecoverRequestPage() {
  const copy = getAuthCopy();
  return (
    <AuthShell title={copy.recover.request.title} subtitle={copy.recover.request.subtitle}>
      <Suspense fallback={<p className="text-slate-500">{copy.common.loading}</p>}>
        <RecoverRequestForm />
      </Suspense>
    </AuthShell>
  );
}
