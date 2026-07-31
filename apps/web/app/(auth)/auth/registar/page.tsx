import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/modules/authentication/components/AuthShell';
import { RegisterForm } from '@/modules/authentication/components/RegisterForm';
import { getAuthCopy } from '@/modules/authentication/content';

export const metadata: Metadata = {
  title: 'Criar conta',
  description: 'Crie a sua conta Kuteka.',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  const copy = getAuthCopy();
  return (
    <AuthShell title={copy.register.title} subtitle={copy.register.subtitle}>
      <Suspense fallback={<p className="text-slate-500">{copy.common.loading}</p>}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
