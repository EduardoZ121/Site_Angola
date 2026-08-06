import { normalizeLocale, type AppLocale } from '@/modules/i18n/types';
import { monetizationCopyEn } from './en';
import { monetizationCopyEs } from './es';
import { monetizationCopyFr } from './fr';
import { monetizationCopyPt, type MonetizationCopy } from './pt';

const MONETIZATION_BY_LOCALE: Record<AppLocale, MonetizationCopy> = {
  pt: monetizationCopyPt,
  en: monetizationCopyEn,
  fr: monetizationCopyFr,
  es: monetizationCopyEs,
};

export function getMonetizationCopy(locale?: AppLocale | string | null): MonetizationCopy {
  return MONETIZATION_BY_LOCALE[normalizeLocale(locale)] ?? monetizationCopyPt;
}

export type { MonetizationCopy };
export { monetizationCopyPt, monetizationCopyEn, monetizationCopyFr, monetizationCopyEs };
