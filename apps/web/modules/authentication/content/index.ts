import { authCopyPt, type AuthCopy } from './pt';

/** MVP locale pt-AO; structure ready for en without shipping EN UI yet. */
export function getAuthCopy(_locale: 'pt' | 'en' = 'pt'): AuthCopy {
  return authCopyPt;
}

export type { AuthCopy };
