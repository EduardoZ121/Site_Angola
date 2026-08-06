import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/modules/authentication/components/AuthShell';
import { RegisterForm } from '@/modules/authentication/components/RegisterForm';
import { AuthLoadingFallback } from '@/modules/authentication/components/AuthLoadingFallback';

export const metadata: Metadata = {
  title: 'Kuteka · Register',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <AuthShell kind="register">
      <Suspense fallback={<AuthLoadingFallback />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
