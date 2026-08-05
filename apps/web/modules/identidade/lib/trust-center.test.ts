import { describe, expect, it } from 'vitest';
import { buildTrustCenterModel, buildKisKaiSuggestions, utsBand } from './trust-center';
import type { IdentityBundle } from '../services/identity-client';

function sampleBundle(overrides?: Partial<IdentityBundle['profile']>): IdentityBundle {
  return {
    email: 'a@b.c',
    emailConfirmed: true,
    address: null,
    document: null,
    banking: null,
    profile: {
      id: 'u1',
      display_name: 'Ana',
      preferred_name: 'Ana',
      legal_full_name: null,
      sex: null,
      birth_date: null,
      nationality: null,
      place_of_birth: null,
      marital_status: null,
      phone_primary: null,
      phone_secondary: null,
      email_secondary: null,
      phone_verified_at: null,
      avatar_url: null,
      selfie_url: null,
      kyc_level: 1,
      trust_index: 30,
      kis_completeness: 28,
      kyc_photo_status: 'missing',
      liveness_status: 'none',
      kyc_identity_status: 'missing',
      kyc_document_status: 'missing',
      kyc_address_status: 'missing',
      kyc_banking_status: 'missing',
      ...overrides,
    },
  };
}

describe('trust center', () => {
  it('bands UTS', () => {
    expect(utsBand(92)).toBe('excellent');
    expect(utsBand(70)).toBe('good');
    expect(utsBand(45)).toBe('fair');
    expect(utsBand(10)).toBe('low');
  });

  it('builds model with next step for phone', () => {
    const model = buildTrustCenterModel(sampleBundle());
    expect(model.accountStatus).toBe('pending');
    expect(model.nextStepId).toBe('contacts');
    expect(model.nextStepTitle.toLowerCase()).toContain('telefone');
    expect(model.pillars.find((p) => p.id === 'email')?.status).toBe('verified');
  });

  it('emits KAI suggestions toward trust center', () => {
    const tips = buildKisKaiSuggestions(sampleBundle({ kyc_level: 0, trust_index: 15 }));
    expect(tips[0]?.href).toBe('/app/centro-confianca');
    expect(tips[0]?.title.toLowerCase()).toMatch(/kuteka pay|identidade|perfil/);
  });
});
