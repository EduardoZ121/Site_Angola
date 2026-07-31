import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/modules/authentication/components/AuthShell';
import { OnboardingRolesForm } from '@/modules/authentication/components/OnboardingRolesForm';
import { getAuthCopy } from '@/modules/authentication/content';

export const metadata: Metadata = {
  title: 'Activar papéis',
  description: 'Escolha como quer usar a Kuteka.',
  robots: { index: false, follow: false },
};

export default function OnboardingRolesPage() {
  const copy = getAuthCopy();
  return (
    <AuthShell title={copy.onboarding.welcomeTitle} subtitle={copy.onboarding.welcomeSubtitle}>
      <Suspense fallback={<p className="text-slate-500">{copy.common.loading}</p>}>
        <OnboardingRolesForm />
      </Suspense>
    </AuthShell>
  );
}
