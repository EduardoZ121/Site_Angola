import { normalizeLocale, type AppLocale } from '@/modules/i18n/types';
import { financeCopyEn, financeHubCopyEn } from './en';
import { financeCopyEs, financeHubCopyEs } from './es';
import { financeCopyFr, financeHubCopyFr } from './fr';
import { financeCopyPt, financeHubCopyPt, type FinanceCopy, type FinanceHubCopy } from './pt';

const FINANCE_BY_LOCALE: Record<AppLocale, FinanceCopy> = {
  pt: financeCopyPt,
  en: financeCopyEn,
  fr: financeCopyFr,
  es: financeCopyEs,
};

const FINANCE_HUB_BY_LOCALE: Record<AppLocale, FinanceHubCopy> = {
  pt: financeHubCopyPt,
  en: financeHubCopyEn,
  fr: financeHubCopyFr,
  es: financeHubCopyEs,
};

export function getFinanceCopy(locale?: AppLocale | string | null): FinanceCopy {
  return FINANCE_BY_LOCALE[normalizeLocale(locale)] ?? financeCopyPt;
}

export function getFinanceHubCopy(locale?: AppLocale | string | null): FinanceHubCopy {
  return FINANCE_HUB_BY_LOCALE[normalizeLocale(locale)] ?? financeHubCopyPt;
}

export type { FinanceCopy, FinanceHubCopy };
export { financeCopyPt, financeHubCopyPt };
