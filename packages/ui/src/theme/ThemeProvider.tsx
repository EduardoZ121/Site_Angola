'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'kuteka-theme';

/**
 * Beta: authenticated UI uses cream/white panels over a dark cinematic atmosphere.
 * Following OS dark mode toggles `.dark` and Tailwind `dark:` utilities — which turn
 * headings/labels/inputs nearly invisible on those light panels. Until a real dark
 * surface system exists, lock the document to light.
 */
const BETA_FORCE_LIGHT = true;

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  if (BETA_FORCE_LIGHT) return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setThemeState(getInitialTheme());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const effective: Theme = BETA_FORCE_LIGHT ? 'light' : theme;
    root.classList.toggle('dark', effective === 'dark');
    root.style.colorScheme = effective === 'dark' ? 'dark' : 'light';
    window.localStorage.setItem(STORAGE_KEY, effective);
  }, [theme, mounted]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(BETA_FORCE_LIGHT ? 'light' : next);
  }, []);

  const toggleTheme = useCallback(() => {
    if (BETA_FORCE_LIGHT) {
      setThemeState('light');
      return;
    }
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(
    () => ({
      theme: BETA_FORCE_LIGHT ? ('light' as const) : theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
