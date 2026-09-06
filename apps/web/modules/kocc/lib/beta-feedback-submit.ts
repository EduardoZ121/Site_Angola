/** Client-side guards for beta_feedback submit — mirrors migration 0035 checks. */

const MAX_BODY = 4000;
const MIN_BODY = 3;
const MAX_PAGE_PATH = 500;

export function sanitizeBetaPagePath(path: string | null | undefined): string | null {
  if (path == null) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  // Prefer path-only; strip origin if a full URL was passed.
  let value = trimmed;
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      value = new URL(trimmed).pathname || '/';
    }
  } catch {
    value = trimmed.split('?')[0] ?? trimmed;
  }
  value = value.split('?')[0]?.split('#')[0] ?? value;
  if (value.length > MAX_PAGE_PATH) {
    value = value.slice(0, MAX_PAGE_PATH);
  }
  return value || null;
}

export function normalizeBetaFeedbackBody(body: string): string {
  return body.trim();
}

export function isValidBetaFeedbackBody(body: string): boolean {
  const len = normalizeBetaFeedbackBody(body).length;
  return len >= MIN_BODY && len <= MAX_BODY;
}

export function isValidBetaFeedbackKind(kind: string): kind is 'feedback' | 'bug' {
  return kind === 'feedback' || kind === 'bug';
}
