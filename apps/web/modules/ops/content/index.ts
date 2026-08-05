import type { AppLocale } from '@/modules/i18n/types';
import { opsCopyEn } from './en';
import { opsCopyEs } from './es';
import { opsCopyFr } from './fr';
import { opsCopyPt, type OpsCopy } from './pt';

const OPS_BY_LOCALE: Record<AppLocale, OpsCopy> = {
  pt: opsCopyPt,
  en: opsCopyEn,
  fr: opsCopyFr,
  es: opsCopyEs,
};

export function getOpsCopy(locale: AppLocale = 'pt'): OpsCopy {
  return OPS_BY_LOCALE[locale] ?? opsCopyPt;
}

export type { OpsCopy };
export { opsCopyPt };
