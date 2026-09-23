/** Client-side guards for beta_feedback submit — mirrors migrations 0035 + 0046. */

import { HELP_SECTION_IDS } from '@/modules/shell/lib/help-sections';
import {
  isValidBetaFeedbackKindExpanded,
  type BetaFeedbackKind,
} from './beta-feedback-status';

const MAX_BODY = 4000;
const MIN_BODY = 3;
const MAX_PAGE_PATH = 500;

/** Help Center sections — only these query values are preserved on page_path. */
const ALLOWED_SEC = new Set<string>(HELP_SECTION_IDS);

/**
 * Sanitize page_path for submit.
 * Strips origin/hash/unknown query; optionally keeps allowlisted `?sec=`.
 */
export function sanitizeBetaPagePath(path: string | null | undefined): string | null {
  if (path == null) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;

  let pathname = trimmed;
  let search = '';
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      pathname = url.pathname || '/';
      search = url.search;
    } else {
      const q = trimmed.indexOf('?');
      const h = trimmed.indexOf('#');
      const end = q === -1 ? (h === -1 ? trimmed.length : h) : h === -1 ? q : Math.min(q, h);
      pathname = trimmed.slice(0, end) || '/';
      if (q !== -1) {
        search = trimmed.slice(q, h === -1 ? undefined : h);
      }
    }
  } catch {
    pathname = trimmed.split('?')[0]?.split('#')[0] ?? trimmed;
    search = '';
  }

  pathname = pathname.split('#')[0] || '/';

  let sec: string | null = null;
  if (search) {
    try {
      const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
      const raw = params.get('sec');
      if (raw && ALLOWED_SEC.has(raw)) sec = raw;
    } catch {
      /* ignore malformed query */
    }
  }

  let value = sec ? `${pathname}?sec=${sec}` : pathname;
  if (value.length > MAX_PAGE_PATH) {
    value = value.slice(0, MAX_PAGE_PATH);
  }
  return value || null;
}

/** Trim + strip C0 controls except tab/newline (keep readable multiline). */
export function normalizeBetaFeedbackBody(body: string): string {
  return body.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

export function isValidBetaFeedbackBody(body: string): boolean {
  const len = normalizeBetaFeedbackBody(body).length;
  return len >= MIN_BODY && len <= MAX_BODY;
}

/** Legacy narrow check — feedback|bug only (pre-0046 forms). */
export function isValidBetaFeedbackKind(kind: string): kind is 'feedback' | 'bug' {
  return kind === 'feedback' || kind === 'bug';
}

/** Expanded kinds from migration 0046 (avaliacao / reclamacao). */
export function isValidBetaFeedbackKindAny(kind: string): kind is BetaFeedbackKind {
  return isValidBetaFeedbackKindExpanded(kind);
}
