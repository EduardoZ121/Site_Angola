import { normalizeLocale, type AppLocale } from '../../i18n/types';
import { confiancaCopyEn } from './en';
import { confiancaCopyEs } from './es';
import { confiancaCopyFr } from './fr';
import { confiancaCopyPt, type ConfiancaCopy } from './pt';

const BY_LOCALE: Record<AppLocale, ConfiancaCopy> = {
  pt: confiancaCopyPt,
  en: confiancaCopyEn,
  fr: confiancaCopyFr,
  es: confiancaCopyEs,
};

export function getConfiancaCopy(locale: AppLocale | string = 'pt'): ConfiancaCopy {
  return BY_LOCALE[normalizeLocale(locale)] ?? confiancaCopyPt;
}

export type { ConfiancaCopy };
export { confiancaCopyPt, confiancaCopyEn, confiancaCopyFr, confiancaCopyEs };
