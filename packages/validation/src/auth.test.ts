import { describe, expect, it } from 'vitest';
import {
  loginSchema,
  normalizeEmail,
  newPasswordSchema,
  onboardingRolesSchema,
  passwordRules,
  recoverSchema,
  registerSchema,
} from './auth';

describe('normalizeEmail (R5)', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Foo@Bar.COM ')).toBe('foo@bar.com');
  });
});

describe('passwordRules (R4)', () => {
  it('requires length, upper, and digit', () => {
    expect(passwordRules.isValid('short')).toBe(false);
    expect(passwordRules.isValid('nouppercase1')).toBe(false);
    expect(passwordRules.isValid('NoDigitHere')).toBe(false);
    expect(passwordRules.isValid('ValidPass1')).toBe(true);
    expect(passwordRules.minLength('12345678')).toBe(true);
    expect(passwordRules.hasUpper('Abc')).toBe(true);
    expect(passwordRules.hasDigit('a1')).toBe(true);
  });
});

describe('registerSchema', () => {
  it('accepts valid registration', () => {
    const parsed = registerSchema.parse({
      email: '  User@Kuteka.AO ',
      password: 'Segura123',
      confirmPassword: 'Segura123',
      termsAccepted: true,
    });
    expect(parsed.email).toBe('user@kuteka.ao');
  });

  it('rejects mismatched passwords and missing terms', () => {
    expect(
      registerSchema.safeParse({
        email: 'a@b.com',
        password: 'Segura123',
        confirmPassword: 'Other123',
        termsAccepted: true,
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        email: 'a@b.com',
        password: 'Segura123',
        confirmPassword: 'Segura123',
        termsAccepted: false,
      }).success,
    ).toBe(false);
  });
});

describe('loginSchema / recoverSchema', () => {
  it('normalizes email on login and recover', () => {
    expect(loginSchema.parse({ email: 'A@B.COM', password: 'x' }).email).toBe('a@b.com');
    expect(recoverSchema.parse({ email: ' A@B.COM ' }).email).toBe('a@b.com');
  });
});

describe('newPasswordSchema', () => {
  it('enforces R4 and confirm match', () => {
    expect(
      newPasswordSchema.parse({ password: 'NovaPass1', confirmPassword: 'NovaPass1' }).password,
    ).toBe('NovaPass1');
    expect(newPasswordSchema.safeParse({ password: 'weak', confirmPassword: 'weak' }).success).toBe(
      false,
    );
  });
});

describe('onboardingRolesSchema', () => {
  it('requires at least one self-serve role', () => {
    expect(onboardingRolesSchema.parse({ roles: ['client'] }).roles).toEqual(['client']);
    expect(
      onboardingRolesSchema.parse({ roles: ['client', 'patrimonial_partner'] }).roles,
    ).toHaveLength(2);
    expect(onboardingRolesSchema.safeParse({ roles: [] }).success).toBe(false);
  });
});
