/**
 * Contact policy — Kuteka Chat MVP (Sprint Beta 1.5).
 *
 * Phone/email are NEVER shown by default anywhere in the product. All
 * communication between Kuteka accounts stays inside Kuteka Chat until one
 * of the following is true:
 *   1. There is an active or completed contract (property_contracts) tied
 *      to the conversation; or
 *   2. A visit has been scheduled (future extension); or
 *   3. An administrator has granted an explicit share authorization
 *      (future extension — metadata.authorized=true).
 *
 * This module only holds pure, framework-free helpers so it is trivially
 * unit-testable and reusable from both the inbox UI and any entry-point CTA.
 */
import type { MensagensCopy } from '../content/pt';

export type ContactReleaseInput = {
  /** Conversation has a contract_id AND that contract is active/completed. */
  contractActive: boolean;
};

/**
 * Whether phone/email may be shared in a given conversation. Mirrors the
 * server-side rule enforced by `public.kuteka_chat_contract_active` — this
 * is a client-side mirror for copy/UI decisions only, never a security
 * boundary (the RPC + RLS are the source of truth).
 */
export function canReleaseContacts(input: ContactReleaseInput): boolean {
  return Boolean(input.contractActive);
}

/** Human copy explaining why contacts are (or are not yet) visible. */
export function contactPolicyMessage(copy: MensagensCopy, input: ContactReleaseInput): string {
  return canReleaseContacts(input)
    ? copy.contactPolicy.shareUnlocked
    : copy.contactPolicy.shareLocked;
}

/** Known chat role codes used for pairing / badges. Mirrors the DB mapping. */
export const KUTEKA_CHAT_ROLES = [
  'client',
  'partner',
  'agent',
  'provider',
  'admin',
  'superadmin',
  'other',
] as const;

export type KutekaChatRole = (typeof KUTEKA_CHAT_ROLES)[number];

export function isKutekaChatRole(value: unknown): value is KutekaChatRole {
  return typeof value === 'string' && (KUTEKA_CHAT_ROLES as readonly string[]).includes(value);
}

export function roleLabel(copy: MensagensCopy, role: string | null | undefined): string {
  if (isKutekaChatRole(role)) return copy.roleLabels[role];
  return copy.roleLabels.other;
}

/**
 * Allowed pairs (mirrors public.kuteka_chat_can_pair — server is the
 * source of truth). Kept here only so the UI can pre-empt an obviously
 * disallowed pairing with a friendly message before round-tripping to the
 * RPC (e.g. disabling a "Message" CTA when the viewer has no matching role).
 */
export function rolesCanPair(actorRoles: readonly string[], peerRoles: readonly string[]): boolean {
  const a = new Set(actorRoles);
  const b = new Set(peerRoles);

  if (a.has('admin') || a.has('superadmin') || b.has('admin') || b.has('superadmin')) return true;

  const pairs: Array<[KutekaChatRole, KutekaChatRole]> = [
    ['client', 'partner'],
    ['client', 'agent'],
    ['partner', 'agent'],
    ['provider', 'partner'],
    ['provider', 'client'],
  ];

  return pairs.some(([x, y]) => (a.has(x) && b.has(y)) || (a.has(y) && b.has(x)));
}
