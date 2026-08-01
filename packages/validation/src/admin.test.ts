import { describe, expect, it } from 'vitest';
import { assignCertifiedAgentSchema } from './admin';

describe('assignCertifiedAgentSchema', () => {
  it('requires uuid', () => {
    expect(assignCertifiedAgentSchema.safeParse({ userId: 'x' }).success).toBe(false);
    expect(
      assignCertifiedAgentSchema.safeParse({
        userId: '11111111-1111-4111-8111-111111111111',
      }).success,
    ).toBe(true);
  });
});
