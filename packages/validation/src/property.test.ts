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

  it('accepts rich activation fields and commission settlement', () => {
    const parsed = activatePropertySchema.parse({
      title: 'Moradia Talatona',
      propertyType: 'house',
      purpose: 'rent',
      managementLevel: 'announce_only',
      requestedServices: ['announce'],
      suites: 2,
      parkingSpaces: 1,
      furnished: true,
      hasGarage: true,
      hasPool: false,
      hasGarden: true,
      landAreaM2: 450,
      builtAreaM2: 220,
      commissionSettlement: 'after_first_rent',
    });
    expect(parsed.suites).toBe(2);
    expect(parsed.commissionSettlement).toBe('after_first_rent');
    expect(parsed.hasGarage).toBe(true);
  });
});

describe('propertyRequiresEvaluation', () => {
  it('gates full management and evaluation services', () => {
    expect(propertyRequiresEvaluation(['announce'], 'announce_only')).toBe(false);
    expect(propertyRequiresEvaluation(['announce'], 'full_management')).toBe(true);
    expect(propertyRequiresEvaluation(['evaluation'], 'announce_only')).toBe(true);
  });
});
