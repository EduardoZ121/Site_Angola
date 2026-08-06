import { normalizeLocale, type AppLocale } from '@/modules/i18n/types';
import { identidadeCopyEn } from './en';
import { identidadeCopyEs } from './es';
import { identidadeCopyFr } from './fr';
import { identidadeCopyPt, type IdentidadeCopy } from './pt';

const IDENTIDADE_BY_LOCALE: Record<AppLocale, IdentidadeCopy> = {
  pt: identidadeCopyPt,
  en: identidadeCopyEn,
  fr: identidadeCopyFr,
  es: identidadeCopyEs,
};

export function getIdentidadeCopy(locale?: AppLocale | string | null): IdentidadeCopy {
  return IDENTIDADE_BY_LOCALE[normalizeLocale(locale)] ?? identidadeCopyPt;
}

export type { IdentidadeCopy };
export { identidadeCopyPt };
