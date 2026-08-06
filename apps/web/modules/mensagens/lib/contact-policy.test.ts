import { describe, expect, it } from 'vitest';
import {
  canReleaseContacts,
  contactPolicyMessage,
  isKutekaChatRole,
  roleLabel,
  rolesCanPair,
} from './contact-policy';
import { getMensagensCopy } from '../content';

describe('contact-policy', () => {
  it('does not release contacts without an active/completed contract', () => {
    expect(canReleaseContacts({ contractActive: false })).toBe(false);
    expect(canReleaseContacts({ contractActive: true })).toBe(true);
  });

  it('returns the locked/unlocked copy consistently with canReleaseContacts', () => {
    const copy = getMensagensCopy('pt');
    expect(contactPolicyMessage(copy, { contractActive: false })).toBe(
      copy.contactPolicy.shareLocked,
    );
    expect(contactPolicyMessage(copy, { contractActive: true })).toBe(
      copy.contactPolicy.shareUnlocked,
    );
  });

  it('recognises known chat roles and falls back to "other"', () => {
    expect(isKutekaChatRole('client')).toBe(true);
    expect(isKutekaChatRole('unknown-role')).toBe(false);

    const copy = getMensagensCopy('pt');
    expect(roleLabel(copy, 'partner')).toBe(copy.roleLabels.partner);
    expect(roleLabel(copy, null)).toBe(copy.roleLabels.other);
    expect(roleLabel(copy, 'not-a-role')).toBe(copy.roleLabels.other);
  });

  describe('rolesCanPair (mirrors public.kuteka_chat_can_pair)', () => {
    it('allows Client↔Partner', () => {
      expect(rolesCanPair(['client'], ['partner'])).toBe(true);
      expect(rolesCanPair(['partner'], ['client'])).toBe(true);
    });

    it('allows Client↔Agent and Partner↔Agent', () => {
      expect(rolesCanPair(['client'], ['agent'])).toBe(true);
      expect(rolesCanPair(['partner'], ['agent'])).toBe(true);
    });

    it('allows Provider↔Partner', () => {
      expect(rolesCanPair(['provider'], ['partner'])).toBe(true);
    });

    it('allows Provider↔Client (server still enforces the contract check)', () => {
      expect(rolesCanPair(['provider'], ['client'])).toBe(true);
    });

    it('allows Admin/SuperAdmin with anyone', () => {
      expect(rolesCanPair(['admin'], ['client'])).toBe(true);
      expect(rolesCanPair(['client'], ['superadmin'])).toBe(true);
    });

    it('rejects unrelated role pairs (e.g. two clients)', () => {
      expect(rolesCanPair(['client'], ['client'])).toBe(false);
      expect(rolesCanPair(['agent'], ['provider'])).toBe(false);
    });
  });
});
