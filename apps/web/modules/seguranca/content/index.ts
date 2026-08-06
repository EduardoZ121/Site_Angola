import { normalizeLocale, type AppLocale } from '@/modules/i18n/types';
import { segurancaCopyEn } from './en';
import { segurancaCopyEs } from './es';
import { segurancaCopyFr } from './fr';
import { segurancaCopyPt, type SegurancaCopy } from './pt';

const SEGURANCA_BY_LOCALE: Record<AppLocale, SegurancaCopy> = {
  pt: segurancaCopyPt,
  en: segurancaCopyEn,
  fr: segurancaCopyFr,
  es: segurancaCopyEs,
};

export function getSegurancaCopy(locale?: AppLocale | string | null): SegurancaCopy {
  return SEGURANCA_BY_LOCALE[normalizeLocale(locale)] ?? segurancaCopyPt;
}

export type { SegurancaCopy };
export { segurancaCopyPt, segurancaCopyEn, segurancaCopyFr, segurancaCopyEs };
