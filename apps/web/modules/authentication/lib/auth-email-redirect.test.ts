import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  buildAuthEmailRedirect,
  computeNeedsEmailVerification,
  isMailDeliveryFailure,
} from '../services/auth-client';

describe('buildAuthEmailRedirect', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds trailing slash and origin for static export routes', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://kutekalink.com' },
    });
    expect(buildAuthEmailRedirect('/auth/verificar')).toBe(
      'https://kutekalink.com/auth/verificar/',
    );
    expect(buildAuthEmailRedirect('/auth/verificar', '/app')).toBe(
      'https://kutekalink.com/auth/verificar/?next=%2Fapp',
    );
  });
});

describe('computeNeedsEmailVerification', () => {
  it('requires F2 when email is not confirmed, even with a session', () => {
    expect(computeNeedsEmailVerification({ emailConfirmedAt: null, hasSession: true })).toBe(true);
    expect(computeNeedsEmailVerification({ emailConfirmedAt: undefined, hasSession: false })).toBe(
      true,
    );
  });

  it('skips F2 when email is already confirmed', () => {
    expect(
      computeNeedsEmailVerification({
        emailConfirmedAt: '2026-09-17T00:00:00Z',
        hasSession: true,
      }),
    ).toBe(false);
  });
});

describe('isMailDeliveryFailure', () => {
  it('detects GoTrue SMTP delivery errors', () => {
    expect(isMailDeliveryFailure('Error sending confirmation email', 'unexpected_failure')).toBe(
      true,
    );
    expect(isMailDeliveryFailure('Error sending recovery email')).toBe(true);
    expect(isMailDeliveryFailure('Invalid login credentials')).toBe(false);
  });
});
