import type { ReactNode } from 'react';
import { AuthShell } from '@/modules/authentication/components/AuthShell';

/**
 * Auth route group layout — shell chrome is applied per-page via AuthShell
 * so each screen can supply its own title/subtitle (one mission per screen).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export { AuthShell };
