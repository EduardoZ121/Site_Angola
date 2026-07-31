import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/modules/authentication/components/AuthShell';
import { RecoverConfirmForm } from '@/modules/authentication/components/RecoverConfirmForm';
import { getAuthCopy } from '@/modules/authentication/content';

export const metadata: Metadata = {
  title: 'Nova password',
  description: 'Defina uma nova password Kuteka.',
  robots: { index: false, follow: false },
};

export default function RecoverConfirmPage() {
  const copy = getAuthCopy();
  return (
    <AuthShell title={copy.recover.confirm.title} subtitle={copy.recover.confirm.subtitle}>
      <Suspense fallback={<p className="text-slate-500">{copy.common.loading}</p>}>
        <RecoverConfirmForm />
      </Suspense>
    </AuthShell>
  );
}
