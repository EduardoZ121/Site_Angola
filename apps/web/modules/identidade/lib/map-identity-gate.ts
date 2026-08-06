import { getIdentidadeCopy } from '../content';
import type { AppLocale } from '@/modules/i18n/types';

/** Map Supabase / RPC identity gate errors to locale-aware copy. */
export function mapIdentityGateMessage(
  raw: string | null | undefined,
  fallback: string,
  locale: AppLocale = 'pt',
): string {
  const msg = (raw ?? '').toLowerCase();
  if (
    msg.includes('identity verification') ||
    msg.includes('kyc level') ||
    msg.includes('assert_actor_meets_kyc') ||
    (msg.includes('kyc') && msg.includes('required'))
  ) {
    return getIdentidadeCopy(locale).kycGateHint;
  }
  return raw?.trim() || fallback;
}
