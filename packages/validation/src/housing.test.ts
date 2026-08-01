import { describe, expect, it } from 'vitest';
import { clientPreferencesSchema } from './housing';

describe('clientPreferencesSchema', () => {
  it('accepts empty preferences', () => {
    const parsed = clientPreferencesSchema.safeParse({});
    expect(parsed.success).toBe(true);
  });

  it('accepts purpose and location', () => {
    const parsed = clientPreferencesSchema.safeParse({
      purpose: 'rent',
      province: 'Luanda',
      city: 'Maianga',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.purpose).toBe('rent');
      expect(parsed.data.city).toBe('Maianga');
    }
  });

  it('rejects invalid purpose', () => {
    const parsed = clientPreferencesSchema.safeParse({ purpose: 'lease' });
    expect(parsed.success).toBe(false);
  });
});
