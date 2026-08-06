import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/modules/authentication/components/AuthShell';
import { VerifyPanel } from '@/modules/authentication/components/VerifyPanel';
import { AuthLoadingFallback } from '@/modules/authentication/components/AuthLoadingFallback';

export const metadata: Metadata = {
  title: 'Kuteka · Verify',
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  return (
    <AuthShell kind="verify">
      <Suspense fallback={<AuthLoadingFallback />}>
        <VerifyPanel />
      </Suspense>
    </AuthShell>
  );
}
