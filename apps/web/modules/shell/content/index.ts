import type { AppLocale } from '@/modules/i18n/types';
import { shellCopyEn } from './en';
import { shellCopyEs } from './es';
import { shellCopyFr } from './fr';
import { shellCopyPt, type ShellCopy } from './pt';

const SHELL_BY_LOCALE: Record<AppLocale, ShellCopy> = {
  pt: shellCopyPt,
  en: shellCopyEn,
  fr: shellCopyFr,
  es: shellCopyEs,
};

export function getShellCopy(locale: AppLocale = 'pt'): ShellCopy {
  return SHELL_BY_LOCALE[locale] ?? shellCopyPt;
}

export type { ShellCopy };
export { shellCopyPt };
