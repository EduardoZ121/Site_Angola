import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/modules/authentication/components/AuthShell';
import { LoginForm } from '@/modules/authentication/components/LoginForm';
import { getAuthCopy } from '@/modules/authentication/content';

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Entre no seu espaço Kuteka.',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  const copy = getAuthCopy();
  return (
    <AuthShell title={copy.login.title} subtitle={copy.login.subtitle}>
      <Suspense fallback={<p className="text-slate-500">{copy.common.loading}</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
