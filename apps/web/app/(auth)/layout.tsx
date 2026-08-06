import type { ReactNode } from 'react';
import { LocaleProvider } from '@/modules/i18n/LocaleProvider';
import { AuthShell } from '@/modules/authentication/components/AuthShell';

/**
 * Auth route group — LocaleProvider so titles/forms follow the selected language.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}

export { AuthShell };
