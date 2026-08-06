import { normalizeLocale, type AppLocale } from '../../i18n/types';
import { listingsCopyEn } from './en';
import { listingsCopyEs } from './es';
import { listingsCopyFr } from './fr';
import { listingsCopyPt, type ListingsCopy } from './pt';

const BY_LOCALE: Record<AppLocale, ListingsCopy> = {
  pt: listingsCopyPt,
  en: listingsCopyEn,
  fr: listingsCopyFr,
  es: listingsCopyEs,
};

export function getListingsCopy(locale: AppLocale | string = 'pt'): ListingsCopy {
  return BY_LOCALE[normalizeLocale(locale)] ?? listingsCopyPt;
}

export type { ListingsCopy };
export { listingsCopyPt, listingsCopyEn, listingsCopyFr, listingsCopyEs };
