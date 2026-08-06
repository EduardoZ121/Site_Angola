import { normalizeLocale, type AppLocale } from '../../i18n/types';
import { authCopyEn } from './en';
import { authCopyEs } from './es';
import { authCopyFr } from './fr';
import { authCopyPt, type AuthCopy } from './pt';

const AUTH_BY_LOCALE: Record<AppLocale, AuthCopy> = {
  pt: authCopyPt,
  en: authCopyEn,
  fr: authCopyFr,
  es: authCopyEs,
};

/** Full auth UI copy for the active locale (no Portuguese fallback mix). */
export function getAuthCopy(locale: AppLocale | string = 'pt'): AuthCopy {
  const normalized = normalizeLocale(locale);
  return AUTH_BY_LOCALE[normalized] ?? authCopyPt;
}

/** Resolve locale for non-React services (auth-client) from localStorage. */
export function resolveAuthLocale(explicit?: AppLocale | string | null): AppLocale {
  if (explicit) return normalizeLocale(explicit);
  if (typeof window === 'undefined') return 'pt';
  try {
    return normalizeLocale(window.localStorage.getItem('kuteka-locale'));
  } catch {
    return 'pt';
  }
}

export type { AuthCopy };
export { authCopyPt, authCopyEn, authCopyFr, authCopyEs };
