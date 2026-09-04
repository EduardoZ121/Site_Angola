import { describe, expect, it } from 'vitest';
import { applyDestinationGate, resolveEmailVerified } from './destination-gate';

describe('applyDestinationGate (R1)', () => {
  it('sends anonymous users to login preserving next', () => {
    expect(applyDestinationGate({ hasSession: false, emailVerified: false, roleCodes: [] })).toBe(
      '/auth/entrar',
    );
    expect(
      applyDestinationGate({
        hasSession: false,
        emailVerified: false,
        roleCodes: [],
        next: '/app/settings',
      }),
    ).toContain('/auth/entrar?next=');
  });

  it('requires verify before roles', () => {
    expect(
      applyDestinationGate({
        hasSession: true,
        emailVerified: false,
        roleCodes: [],
        next: '/app',
      }),
    ).toMatch(/^\/auth\/verificar/);
  });

  it('requires onboarding when verified without roles', () => {
    expect(
      applyDestinationGate({
        hasSession: true,
        emailVerified: true,
        roleCodes: [],
      }),
    ).toBe('/auth/onboarding/papeis');
  });

  it('treats Kuteka profile verification as email verified', () => {
    expect(resolveEmailVerified({ authConfirmedAt: null, profileVerifiedAt: null })).toBe(false);
    expect(
      resolveEmailVerified({
        authConfirmedAt: null,
        profileVerifiedAt: '2026-09-04T00:00:00Z',
      }),
    ).toBe(true);
    expect(
      resolveEmailVerified({
        authConfirmedAt: '2026-09-04T00:00:00Z',
        profileVerifiedAt: null,
      }),
    ).toBe(true);
  });

  it('resolves safe next when fully onboarded', () => {
    expect(
      applyDestinationGate({
        hasSession: true,
        emailVerified: true,
        roleCodes: ['client'],
        next: '/app/settings',
      }),
    ).toBe('/app/settings');
    expect(
      applyDestinationGate({
        hasSession: true,
        emailVerified: true,
        roleCodes: ['client'],
        next: '/app/admin',
        hasAdminPanel: false,
      }),
    ).toBe('/app');
  });
});
