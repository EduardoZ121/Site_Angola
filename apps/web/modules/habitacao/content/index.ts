import { normalizeLocale, type AppLocale } from '../../i18n/types';
import { habitacaoCopyEn } from './en';
import { habitacaoCopyEs } from './es';
import { habitacaoCopyFr } from './fr';
import { habitacaoCopyPt, type HabitacaoCopy } from './pt';

const BY_LOCALE: Record<AppLocale, HabitacaoCopy> = {
  pt: habitacaoCopyPt,
  en: habitacaoCopyEn,
  fr: habitacaoCopyFr,
  es: habitacaoCopyEs,
};

export function getHabitacaoCopy(locale: AppLocale | string = 'pt'): HabitacaoCopy {
  return BY_LOCALE[normalizeLocale(locale)] ?? habitacaoCopyPt;
}

export type { HabitacaoCopy };
export { habitacaoCopyPt, habitacaoCopyEn, habitacaoCopyFr, habitacaoCopyEs };
