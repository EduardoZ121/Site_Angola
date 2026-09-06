/**
 * Soft empty-state gate: show "empty" copy only when idle, no rows, and no error.
 * Prevents SoftListSlot empty messaging from masking load failures (metrics/inbox parity).
 */
export function shouldShowSoftEmpty(options: {
  pending: boolean;
  hasItems: boolean;
  hasError: boolean;
}): boolean {
  return !options.pending && !options.hasItems && !options.hasError;
}
