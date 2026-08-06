import { normalizeLocale, type AppLocale } from '../../i18n/types';
import { administracaoCopyEn } from './en';
import { administracaoCopyEs } from './es';
import { administracaoCopyFr } from './fr';
import { administracaoCopyPt, type AdministracaoCopy } from './pt';

const BY_LOCALE: Record<AppLocale, AdministracaoCopy> = {
  pt: administracaoCopyPt,
  en: administracaoCopyEn,
  fr: administracaoCopyFr,
  es: administracaoCopyEs,
};

export function getAdministracaoCopy(locale: AppLocale | string = 'pt'): AdministracaoCopy {
  return BY_LOCALE[normalizeLocale(locale)] ?? administracaoCopyPt;
}

export type { AdministracaoCopy };
export { administracaoCopyPt, administracaoCopyEn, administracaoCopyFr, administracaoCopyEs };
