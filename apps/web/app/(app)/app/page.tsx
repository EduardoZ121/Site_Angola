import type { Metadata } from 'next';
import { AppHomeClient } from '@/modules/authentication/components/AppHomeClient';

export const metadata: Metadata = {
  title: 'O seu espaço',
  robots: { index: false, follow: false },
};

/**
 * Authenticated home stub — client-loaded after onboarding (static-safe).
 */
export default function AppHomePage() {
  return <AppHomeClient />;
}
