import { normalizeLocale, type AppLocale } from '../../i18n/types';
import { mensagensCopyEn } from './en';
import { mensagensCopyEs } from './es';
import { mensagensCopyFr } from './fr';
import { mensagensCopyPt, type MensagensCopy } from './pt';

const BY_LOCALE: Record<AppLocale, MensagensCopy> = {
  pt: mensagensCopyPt,
  en: mensagensCopyEn,
  fr: mensagensCopyFr,
  es: mensagensCopyEs,
};

export function getMensagensCopy(locale: AppLocale | string = 'pt'): MensagensCopy {
  return BY_LOCALE[normalizeLocale(locale)] ?? mensagensCopyPt;
}

export type { MensagensCopy };
export { mensagensCopyPt, mensagensCopyEn, mensagensCopyFr, mensagensCopyEs };
