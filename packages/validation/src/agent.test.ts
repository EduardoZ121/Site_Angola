import { describe, expect, it } from 'vitest';
import { activateAssignmentSchema, agentPreferencesSchema } from './agent';

describe('agentPreferencesSchema', () => {
  it('accepts coverage preferences', () => {
    const parsed = agentPreferencesSchema.safeParse({
      purpose: 'sale',
      province: 'Luanda',
      city: 'Talatona',
    });
    expect(parsed.success).toBe(true);
  });
});

describe('activateAssignmentSchema', () => {
  it('requires propertyId uuid', () => {
    expect(activateAssignmentSchema.safeParse({ propertyId: 'x' }).success).toBe(false);
    expect(
      activateAssignmentSchema.safeParse({
        propertyId: '11111111-1111-4111-8111-111111111111',
      }).success,
    ).toBe(true);
  });
});
