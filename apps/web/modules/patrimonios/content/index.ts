import { normalizeLocale, type AppLocale } from '../../i18n/types';
import { patrimoniosCopyEn } from './en';
import { patrimoniosCopyEs } from './es';
import { patrimoniosCopyFr } from './fr';
import { patrimoniosCopyPt, type PatrimoniosCopy } from './pt';

const BY_LOCALE: Record<AppLocale, PatrimoniosCopy> = {
  pt: patrimoniosCopyPt,
  en: patrimoniosCopyEn,
  fr: patrimoniosCopyFr,
  es: patrimoniosCopyEs,
};

export function getPatrimoniosCopy(locale: AppLocale | string = 'pt'): PatrimoniosCopy {
  return BY_LOCALE[normalizeLocale(locale)] ?? patrimoniosCopyPt;
}

export type { PatrimoniosCopy };
export { patrimoniosCopyPt, patrimoniosCopyEn, patrimoniosCopyFr, patrimoniosCopyEs };
