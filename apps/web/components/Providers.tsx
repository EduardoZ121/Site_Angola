'use client';

import { ThemeProvider, ToastProviderStub } from '@kuteka/ui';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProviderStub>{children}</ToastProviderStub>
    </ThemeProvider>
  );
}
