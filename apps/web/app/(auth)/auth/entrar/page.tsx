import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/modules/authentication/components/AuthShell';
import { LoginForm } from '@/modules/authentication/components/LoginForm';
import { AuthLoadingFallback } from '@/modules/authentication/components/AuthLoadingFallback';

export const metadata: Metadata = {
  title: 'Kuteka · Auth',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <AuthShell kind="login">
      <Suspense fallback={<AuthLoadingFallback />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
