import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/modules/authentication/components/AuthShell';
import { OnboardingProfileForm } from '@/modules/authentication/components/OnboardingProfileForm';
import { AuthLoadingFallback } from '@/modules/authentication/components/AuthLoadingFallback';

export const metadata: Metadata = {
  title: 'Kuteka · Profile',
  robots: { index: false, follow: false },
};

export default function OnboardingProfilePage() {
  return (
    <AuthShell kind="onboardingProfile">
      <Suspense fallback={<AuthLoadingFallback />}>
        <OnboardingProfileForm />
      </Suspense>
    </AuthShell>
  );
}
