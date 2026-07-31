import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthShell } from '@/modules/authentication/components/AuthShell';
import { OnboardingProfileForm } from '@/modules/authentication/components/OnboardingProfileForm';
import { getAuthCopy } from '@/modules/authentication/content';

export const metadata: Metadata = {
  title: 'Perfil',
  description: 'Nome de apresentação na Kuteka.',
  robots: { index: false, follow: false },
};

export default function OnboardingProfilePage() {
  const copy = getAuthCopy();
  return (
    <AuthShell title={copy.onboarding.profile.title} subtitle={copy.onboarding.profile.subtitle}>
      <Suspense fallback={<p className="text-slate-500">{copy.common.loading}</p>}>
        <OnboardingProfileForm />
      </Suspense>
    </AuthShell>
  );
}
