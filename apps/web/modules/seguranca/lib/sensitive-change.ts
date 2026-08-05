/**
 * Sensitive-change step-up — same OTP core as signup/recovery (ADR-026 §4).
 * Call before mutating email, phone, password, document, or banking.
 */

export type SensitiveChangeKind = 'email' | 'phone' | 'password' | 'document' | 'banking';

export function sensitiveChangePurpose(): 'sensitive_change' {
  return 'sensitive_change';
}

export function sensitiveChangeNotifyEvent(kind: SensitiveChangeKind): string {
  const map: Record<SensitiveChangeKind, string> = {
    email: 'email_changed',
    phone: 'phone_changed',
    password: 'password_changed',
    document: 'document_updated',
    banking: 'banking_added',
  };
  return map[kind];
}
