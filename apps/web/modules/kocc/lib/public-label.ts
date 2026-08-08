import { normalizeLocale, type AppLocale } from '@/modules/i18n/types';
import { publicStatusLabel } from './status-labels';

/**
 * Single entry point for module status badges shown to end users. This must
 * NEVER return the word "Demo" (or any other internal jargon) — only
 * reassuring, plain-language copy driven by `operational_status`.
 */
export function publicModuleBadge(
  status: string | null | undefined = 'beta_public',
  locale: AppLocale | string = 'pt',
): string {
  return publicStatusLabel(status, normalizeLocale(locale));
}

/**
 * Some rows still carry a legacy `is_demo` flag (seeded showcase inventory
 * used before real supply/demand exists). We never delete that data — it is
 * still useful internally — but end users must never see the word "Demo".
 * Returns `null` when the row is not demo inventory (render nothing).
 */
export function inventoryBadge(
  isDemo: boolean | null | undefined,
  locale: AppLocale | string = 'pt',
): string | null {
  if (!isDemo) return null;
  return publicModuleBadge('beta_public', locale);
}
