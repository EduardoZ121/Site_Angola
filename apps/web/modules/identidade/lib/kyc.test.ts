import { describe, expect, it } from 'vitest';
import {
  KYC_LEVEL_LABELS,
  actionRequiresKyc,
  formatCompleteness,
  meetsActionKyc,
  minLevelForAction,
  statusGlyph,
  statusLabel,
  statusTone,
  suggestNextKisStep,
} from './kyc';

describe('kis helpers', () => {
  it('exposes KYC labels 0–4', () => {
    expect(KYC_LEVEL_LABELS[0]).toContain('Conta');
    expect(KYC_LEVEL_LABELS[4]).toContain('Premium');
  });

  it('gates actions by level', () => {
    expect(actionRequiresKyc(1, 2)).toBe(false);
    expect(actionRequiresKyc(2, 2)).toBe(true);
    expect(meetsActionKyc(1, 'payment')).toBe(false);
    expect(meetsActionKyc(2, 'contract')).toBe(true);
    expect(minLevelForAction('browse')).toBe(0);
  });

  it('maps pillar status', () => {
    expect(statusGlyph('verified')).toBe('🟢');
    expect(statusGlyph('pending')).toBe('🟡');
    expect(statusLabel('pending')).toBe('Em análise');
    expect(statusTone('rejected')).toBe('danger');
  });

  it('suggests next onboarding step', () => {
    expect(
      suggestNextKisStep({
        emailConfirmed: true,
        phoneVerified: false,
        hasPersonal: false,
        hasDocument: false,
        hasPhoto: false,
        hasAddress: false,
        hasBanking: false,
      }),
    ).toBe('contacts');
    expect(
      suggestNextKisStep({
        emailConfirmed: true,
        phoneVerified: true,
        hasPersonal: true,
        hasDocument: true,
        hasPhoto: true,
        hasAddress: true,
        hasBanking: true,
      }),
    ).toBe('overview');
  });

  it('formats completeness', () => {
    expect(formatCompleteness(45.2)).toBe('45%');
    expect(formatCompleteness(120)).toBe('100%');
  });
});
