import { describe, expect, it } from 'vitest';
import { propertyCompleteness, type PropertyCompletenessInput } from './property-completeness';

const base: PropertyCompletenessInput = {
  title: 'Apartamento Talatona',
  purpose: 'rent',
  property_type: 'apartment',
  price_aoa: 250_000,
  bedrooms: 2,
  bathrooms: 1,
  province: 'Luanda',
  city: 'Talatona',
  cover_image_url: 'https://cdn.example/p.jpg',
  documents_url: 'https://cdn.example/docs.pdf',
  owner_kyc_level: 2,
  lifecycle_status: 'em_analise_admin',
  status: 'draft',
};

describe('propertyCompleteness', () => {
  it('returns 100 when all checklist items are present', () => {
    const result = propertyCompleteness(base);
    expect(result.percent).toBe(100);
    expect(result.missing).toEqual([]);
    expect(result.done).toHaveLength(6);
  });

  it('flags missing photos and identity', () => {
    const result = propertyCompleteness({
      ...base,
      cover_image_url: null,
      media_count: 0,
      owner_kyc_level: 0,
      identity_confirmed: false,
    });
    expect(result.missing).toContain('photos');
    expect(result.missing).toContain('identity');
    expect(result.percent).toBeLessThan(100);
  });

  it('treats media_count as photos even without cover', () => {
    const result = propertyCompleteness({
      ...base,
      cover_image_url: null,
      media_count: 3,
    });
    expect(result.done).toContain('photos');
  });

  it('counts activation via lifecycle or active status', () => {
    expect(
      propertyCompleteness({
        ...base,
        lifecycle_status: null,
        review_status: null,
        status: 'draft',
      }).missing,
    ).toContain('activation_request');
    expect(
      propertyCompleteness({
        ...base,
        lifecycle_status: null,
        review_status: null,
        status: 'active',
      }).done,
    ).toContain('activation_request');
  });

  it('returns 0 for empty draft', () => {
    const result = propertyCompleteness({});
    expect(result.percent).toBe(0);
    expect(result.missing).toHaveLength(6);
  });
});
