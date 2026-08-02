'use client';

import { ThemeProvider, ToastProviderStub } from '@kuteka/ui';
import type { ReactNode } from 'react';
import { LocaleProvider } from '@/modules/i18n/LocaleProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <ToastProviderStub>{children}</ToastProviderStub>
      </LocaleProvider>
    </ThemeProvider>
  );
}
