import { describe, expect, it } from 'vitest';
import { normalizeAngolaPhone, SandboxSmsOtpProvider } from '../providers/sms-otp';
import { securityScoreBand, securityScoreLabel, formatSecurityEvent } from '../lib/security-center';

describe('sms otp provider contract', () => {
  it('normalises Angola mobile numbers', () => {
    expect(normalizeAngolaPhone('923456789')).toBe('+244923456789');
    expect(normalizeAngolaPhone('+244923456789')).toBe('+244923456789');
    expect(normalizeAngolaPhone('244923456789')).toBe('+244923456789');
    expect(normalizeAngolaPhone('12')).toBeNull();
  });

  it('sandbox provider returns sandbox code', async () => {
    const provider = new SandboxSmsOtpProvider();
    const result = await provider.sendOtp({
      toE164: '+244923456789',
      code: '123456',
      purpose: 'phone_verify',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider).toBe('sandbox');
      expect(result.sandboxCode).toBe('123456');
    }
  });
});

describe('security score helpers', () => {
  it('bands and labels', () => {
    expect(securityScoreBand(10)).toBe('low');
    expect(securityScoreBand(40)).toBe('medium');
    expect(securityScoreBand(60)).toBe('high');
    expect(securityScoreBand(90)).toBe('excellent');
    expect(securityScoreLabel(90)).toBe('Excelente');
  });

  it('formats known events', () => {
    expect(formatSecurityEvent('password_changed')).toContain('Palavra-passe');
    expect(formatSecurityEvent('custom_x')).toBe('custom x');
  });
});
