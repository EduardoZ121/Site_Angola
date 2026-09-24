import { describe, expect, it } from 'vitest';
import {
  normalizeIban,
  validateCompanyProfile,
  validateVaultCode,
  vaultErrorMessage,
  EMPTY_COMPANY_PROFILE,
} from './company-vault';

describe('company vault', () => {
  it('normalizes IBAN spaces and rejects a short value', () => {
    expect(normalizeIban('ao06 0000 0000 0000 0000 0000 1')).toBe('AO06000000000000000000001');
    expect(validateCompanyProfile({ ...EMPTY_COMPANY_PROFILE, iban: 'AO06' })).toMatch(/IBAN/);
  });

  it('accepts a plausible institutional IBAN and official email', () => {
    expect(
      validateCompanyProfile({
        ...EMPTY_COMPANY_PROFILE,
        iban: 'AO06000000000000000000001',
        email: 'financeiro@kutekalink.com',
        currency: 'aoa',
      }),
    ).toBeNull();
  });

  it('requires a second code of at least 8 characters', () => {
    expect(validateVaultCode('curto')).toMatch(/8 e 64/);
    expect(validateVaultCode('cofre-kuteka')).toBeNull();
  });

  it('maps backend vault codes without echoing the secret', () => {
    expect(vaultErrorMessage('KUTEKA_VAULT_BAD_CODE')).toMatch(/incorrecto/);
    expect(vaultErrorMessage('function founder_company_profile_read does not exist')).toMatch(
      /não está activo/,
    );
  });
});
