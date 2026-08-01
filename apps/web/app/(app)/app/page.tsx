import type { Metadata } from 'next';
import { AppHomeClient } from '@/modules/authentication/components/AppHomeClient';

export const metadata: Metadata = {
  title: 'O seu espaço',
  robots: { index: false, follow: false },
};

/** Authenticated home — shortcuts + continuous platform feed. */
export default function AppHomePage() {
  return <AppHomeClient />;
}
