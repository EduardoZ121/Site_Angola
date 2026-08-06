import { normalizeLocale, type AppLocale } from '@/modules/i18n/types';
import { landingCopyEn } from './en';
import { landingCopyEs } from './es';
import { landingCopyFr } from './fr';
import { landingCopyPt, type LandingCopy } from './pt';

const LANDING_BY_LOCALE: Record<AppLocale, LandingCopy> = {
  pt: landingCopyPt,
  en: landingCopyEn,
  fr: landingCopyFr,
  es: landingCopyEs,
};

export function getLandingCopy(locale?: AppLocale | string | null): LandingCopy {
  return LANDING_BY_LOCALE[normalizeLocale(locale)] ?? landingCopyPt;
}

export type { LandingCopy };
export { landingCopyPt };
