import { normalizeLocale, type AppLocale } from '../../i18n/types';
import { contratosCopyEn } from './en';
import { contratosCopyEs } from './es';
import { contratosCopyFr } from './fr';
import { contratosCopyPt, type ContratosCopy } from './pt';

const BY_LOCALE: Record<AppLocale, ContratosCopy> = {
  pt: contratosCopyPt,
  en: contratosCopyEn,
  fr: contratosCopyFr,
  es: contratosCopyEs,
};

export function getContratosCopy(locale: AppLocale | string = 'pt'): ContratosCopy {
  return BY_LOCALE[normalizeLocale(locale)] ?? contratosCopyPt;
}

export type { ContratosCopy };
export { contratosCopyPt, contratosCopyEn, contratosCopyFr, contratosCopyEs };
