import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/modules/authentication/components/AuthShell';
import { RecoverRequestForm } from '@/modules/authentication/components/RecoverRequestForm';
import { AuthLoadingFallback } from '@/modules/authentication/components/AuthLoadingFallback';

export const metadata: Metadata = {
  title: 'Kuteka · Recover',
  robots: { index: false, follow: false },
};

export default function RecoverPage() {
  return (
    <AuthShell kind="recover">
      <Suspense fallback={<AuthLoadingFallback />}>
        <RecoverRequestForm />
      </Suspense>
    </AuthShell>
  );
}
