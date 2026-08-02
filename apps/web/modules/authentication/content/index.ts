import type { AppLocale } from '@/modules/i18n/types';
import { authCopyPt, type AuthCopy } from './pt';

/** Auth dictionaries — shell chrome is fully multilingual; auth body stays pt-AO until EN/FR/ES packs land. */
export function getAuthCopy(_locale: AppLocale | 'pt' | 'en' = 'pt'): AuthCopy {
  return authCopyPt;
}

export type { AuthCopy };
