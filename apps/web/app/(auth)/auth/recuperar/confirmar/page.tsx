import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/modules/authentication/components/AuthShell';
import { RecoverConfirmForm } from '@/modules/authentication/components/RecoverConfirmForm';
import { AuthLoadingFallback } from '@/modules/authentication/components/AuthLoadingFallback';

export const metadata: Metadata = {
  title: 'Kuteka · New password',
  robots: { index: false, follow: false },
};

export default function RecoverConfirmPage() {
  return (
    <AuthShell kind="recoverConfirm">
      <Suspense fallback={<AuthLoadingFallback />}>
        <RecoverConfirmForm />
      </Suspense>
    </AuthShell>
  );
}
