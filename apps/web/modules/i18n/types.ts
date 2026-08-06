export const APP_LOCALES = ['pt', 'en', 'fr', 'es'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const LOCALE_STORAGE_KEY = 'kuteka-locale';

export const LOCALE_LABELS: Record<AppLocale, string> = {
  pt: 'Português',
  en: 'English',
  fr: 'Français',
  es: 'Español',
};

export const LOCALE_HTML_LANG: Record<AppLocale, string> = {
  pt: 'pt',
  en: 'en',
  fr: 'fr',
  es: 'es',
};

/** BCP-47 tag for Intl date/number formatting per locale (pt keeps Angola formatting). */
export const LOCALE_INTL_TAG: Record<AppLocale, string> = {
  pt: 'pt-AO',
  en: 'en-US',
  fr: 'fr-FR',
  es: 'es-ES',
};

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (APP_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: unknown, fallback: AppLocale = 'pt'): AppLocale {
  if (isAppLocale(value)) return value;
  if (typeof value === 'string') {
    const base = value.toLowerCase().slice(0, 2);
    if (isAppLocale(base)) return base;
  }
  return fallback;
}
