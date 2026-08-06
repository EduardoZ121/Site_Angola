import { LOCALE_STORAGE_KEY, normalizeLocale, type AppLocale } from './types';

/**
 * Resolve the active UI locale outside of React (services, non-component modules).
 * Mirrors LocaleProvider's initial read from localStorage so client-only
 * services keep messages consistent with whatever the shell is showing.
 */
export function resolveUiLocale(fallback: AppLocale = 'pt'): AppLocale {
  if (typeof window === 'undefined') return fallback;
  try {
    return normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY), fallback);
  } catch {
    return fallback;
  }
}
