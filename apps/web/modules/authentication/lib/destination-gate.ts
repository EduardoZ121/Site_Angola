import { resolveSafeNextPath } from '@kuteka/auth';

export interface DestinationGateInput {
  /** Authenticated session present */
  hasSession: boolean;
  emailVerified: boolean;
  roleCodes: readonly string[];
  hasAdminPanel?: boolean;
  next?: string | null;
}

function withNext(path: string, next: string | null | undefined): string {
  if (!next || !next.trim()) return path;
  const safe = next.trim();
  // Preserve raw next through F2/F6; final destination still runs resolveSafeNextPath
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}next=${encodeURIComponent(safe)}`;
}

/**
 * R1 destination gate — fixed order:
 * (1) session (2) email verified → F2 (3) ≥1 role → F6 (4) safe next → /app
 */
export function applyDestinationGate(input: DestinationGateInput): string {
  if (!input.hasSession) {
    return withNext('/auth/entrar', input.next);
  }
  if (!input.emailVerified) {
    return withNext('/auth/verificar', input.next);
  }
  if (!input.roleCodes.length) {
    // Profile name step is optional; roles gate is F6 entry
    return withNext('/auth/onboarding/papeis', input.next);
  }
  return resolveSafeNextPath(input.next, { hasAdminPanel: input.hasAdminPanel });
}
