import { describe, expect, it } from 'vitest';
import { activatePropertySchema } from './property';

describe('activatePropertySchema', () => {
  it('accepts a minimal valid activation', () => {
    const parsed = activatePropertySchema.parse({
      title: 'Residência Maianga',
      propertyType: 'apartment',
      purpose: 'rent',
    });
    expect(parsed.status).toBe('active');
  });

  it('rejects short titles', () => {
    expect(() =>
      activatePropertySchema.parse({
        title: 'ab',
        propertyType: 'house',
        purpose: 'sale',
      }),
    ).toThrow();
  });
});
