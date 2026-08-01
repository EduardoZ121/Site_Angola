import { describe, expect, it } from 'vitest';
import { contractTransitionSchema, createPropertyContractSchema } from './contracts';

describe('contracts validation', () => {
  it('accepts a valid property contract payload', () => {
    const result = createPropertyContractSchema.safeParse({
      propertyId: '00000000-0000-4000-8000-000000000001',
      clientId: '00000000-0000-4000-8000-000000000002',
      agentId: null,
      interestId: null,
      purpose: 'rent',
      amountAoa: 450000,
      title: 'Contrato de arrendamento — Apartamento T3 Kilamba',
      termsNotes: 'Minuta inicial.',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid transitions', () => {
    const result = contractTransitionSchema.safeParse({ contractId: 'not-a-uuid' });

    expect(result.success).toBe(false);
  });
});
