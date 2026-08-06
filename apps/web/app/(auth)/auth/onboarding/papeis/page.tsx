import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/modules/authentication/components/AuthShell';
import { OnboardingRolesForm } from '@/modules/authentication/components/OnboardingRolesForm';
import { AuthLoadingFallback } from '@/modules/authentication/components/AuthLoadingFallback';

export const metadata: Metadata = {
  title: 'Kuteka · Roles',
  robots: { index: false, follow: false },
};

export default function OnboardingRolesPage() {
  return (
    <AuthShell kind="onboardingRoles">
      <Suspense fallback={<AuthLoadingFallback />}>
        <OnboardingRolesForm />
      </Suspense>
    </AuthShell>
  );
}
