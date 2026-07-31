'use client';

import { createContext, useContext } from 'react';

export type AppSessionData = {
  email: string | null;
  displayName: string | null;
  roles: string[];
};

type AppSessionContextValue = {
  session: AppSessionData | null;
  status: 'loading' | 'ready' | 'error';
  error: string | null;
};

export const AppSessionContext = createContext<AppSessionContextValue>({
  session: null,
  status: 'loading',
  error: null,
});

export function useAppSession() {
  return useContext(AppSessionContext);
}

export function roleLabelPt(code: string, labels: Record<string, string>): string {
  return labels[code] ?? code;
}
