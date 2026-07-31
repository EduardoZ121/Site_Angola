/**
 * Safe post-auth redirect path (PRD-001 §16.6 / R3).
 * Only relative `/app…` paths; open-redirect hardened.
 */
export function resolveSafeNextPath(
  next: string | null | undefined,
  opts?: { hasAdminPanel?: boolean },
): string {
  const fallback = '/app';
  if (next == null || typeof next !== 'string') return fallback;

  const trimmed = next.trim();
  if (!trimmed) return fallback;

  // Absolute / protocol-relative / scheme
  if (
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) ||
    trimmed.startsWith('//') ||
    trimmed.includes('\\')
  ) {
    return fallback;
  }

  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return fallback;
  }

  if (
    decoded.includes('..') ||
    decoded.includes('\\') ||
    decoded.startsWith('//') ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)
  ) {
    return fallback;
  }

  if (!decoded.startsWith('/')) return fallback;
  if (decoded === '/app' || decoded === '/app/') return '/app';

  // Must stay under /app
  if (!decoded.startsWith('/app/')) return fallback;

  // Normalize trailing slash for comparison (keep path otherwise)
  const pathOnly = decoded.split('?')[0]?.split('#')[0] ?? decoded;
  if (pathOnly.includes('..')) return fallback;

  if (pathOnly === '/app/admin' || pathOnly.startsWith('/app/admin/')) {
    if (opts?.hasAdminPanel) {
      return pathOnly === '/app/admin/' ? '/app/admin' : pathOnly;
    }
    return fallback;
  }

  return pathOnly === '/app/' ? '/app' : pathOnly;
}
