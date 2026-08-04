import { describe, expect, it } from 'vitest';
import { KYC_LEVEL_LABELS, actionRequiresKyc, statusGlyph, statusLabel, statusTone } from './kyc';

describe('kyc helpers', () => {
  it('labels all levels', () => {
    expect(KYC_LEVEL_LABELS[0]).toContain('Nível 0');
    expect(KYC_LEVEL_LABELS[4]).toContain('Premium');
  });

  it('gates actions by minimum level', () => {
    expect(actionRequiresKyc(1, 2)).toBe(false);
    expect(actionRequiresKyc(2, 2)).toBe(true);
    expect(actionRequiresKyc(3, 2)).toBe(true);
  });

  it('maps status presentation', () => {
    expect(statusTone('verified')).toBe('success');
    expect(statusTone('pending')).toBe('warning');
    expect(statusGlyph('missing')).toBe('⚪');
    expect(statusLabel('rejected')).toBe('Rejeitado');
  });
});
