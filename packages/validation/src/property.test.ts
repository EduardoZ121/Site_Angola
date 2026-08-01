import { describe, expect, it } from 'vitest';
import { activatePropertySchema, propertyRequiresEvaluation } from './property';

describe('activatePropertySchema', () => {
  it('accepts a minimal valid activation with services + management', () => {
    const parsed = activatePropertySchema.parse({
      title: 'Residência Maianga',
      propertyType: 'apartment',
      purpose: 'rent',
      managementLevel: 'announce_only',
      requestedServices: ['announce'],
    });
    expect(parsed.requestedServices).toEqual(['announce']);
    expect(parsed.unfinishedIntent).toBe('none');
  });

  it('rejects short titles', () => {
    expect(() =>
      activatePropertySchema.parse({
        title: 'ab',
        propertyType: 'house',
        purpose: 'sale',
        managementLevel: 'announce_only',
        requestedServices: ['announce'],
      }),
    ).toThrow();
  });

  it('requires unfinished intent when construction is partial', () => {
    const result = activatePropertySchema.safeParse({
      title: 'Obra Talatona',
      propertyType: 'house',
      purpose: 'sale',
      managementLevel: 'full_management',
      requestedServices: ['construction_finish'],
      constructionStatus: 'partial',
      unfinishedIntent: 'none',
    });
    expect(result.success).toBe(false);
  });
});

describe('propertyRequiresEvaluation', () => {
  it('gates full management and evaluation services', () => {
    expect(propertyRequiresEvaluation(['announce'], 'announce_only')).toBe(false);
    expect(propertyRequiresEvaluation(['announce'], 'full_management')).toBe(true);
    expect(propertyRequiresEvaluation(['evaluation'], 'announce_only')).toBe(true);
  });
});
