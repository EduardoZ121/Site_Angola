import { describe, expect, it } from 'vitest';
import {
  identityAddressSchema,
  identityIdDocumentSchema,
  identityPersonalSchema,
} from './identity';

describe('identity validation', () => {
  it('requires legal full name', () => {
    const bad = identityPersonalSchema.safeParse({ legalFullName: 'Ab' });
    expect(bad.success).toBe(false);
    const ok = identityPersonalSchema.safeParse({
      legalFullName: 'Maria José dos Santos',
      nationality: 'Angolana',
      birthDate: '1992-04-12',
    });
    expect(ok.success).toBe(true);
  });

  it('validates address province/municipality', () => {
    const ok = identityAddressSchema.safeParse({
      country: 'AO',
      province: 'Luanda',
      municipality: 'Belas',
    });
    expect(ok.success).toBe(true);
  });

  it('validates id document kind and number', () => {
    const ok = identityIdDocumentSchema.safeParse({
      docKind: 'bi',
      docNumber: '000123456LA047',
      issuingCountry: 'AO',
    });
    expect(ok.success).toBe(true);
  });
});
