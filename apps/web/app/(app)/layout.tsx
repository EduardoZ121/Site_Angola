import type { ReactNode } from 'react';
import { AppShell } from '@/modules/authentication/components/AppShell';

/**
 * Authenticated area chrome — client gate only (static export safe).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
