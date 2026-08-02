'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { LOCALE_HTML_LANG, LOCALE_STORAGE_KEY, normalizeLocale, type AppLocale } from './types';

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'pt',
  setLocale: () => undefined,
  ready: false,
});

export function useLocale() {
  return useContext(LocaleContext);
}

type LocaleProviderProps = {
  children: ReactNode;
  /** Optional seed from profile once session is known. */
  profileLocale?: string | null;
};

export function LocaleProvider({ children, profileLocale }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<AppLocale>('pt');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      stored = null;
    }
    const next = normalizeLocale(profileLocale || stored || 'pt');
    setLocaleState(next);
    setReady(true);
  }, [profileLocale]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = LOCALE_HTML_LANG[locale];
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale, ready]);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    void (async () => {
      try {
        const client = createBrowserClient();
        const {
          data: { user },
        } = await client.auth.getUser();
        if (!user) return;
        await client.from('profiles').update({ locale: next }).eq('id', user.id);
      } catch {
        /* offline / RLS — local preference still applies */
      }
    })();
  }, []);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      ready,
    }),
    [locale, setLocale, ready],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
