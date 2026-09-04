import { describe, expect, it } from 'vitest';
import { isHousingRowPubliclyVisible, type HousingPropertyRow } from './housing-client';

function row(overrides: Partial<HousingPropertyRow> = {}): HousingPropertyRow {
  return {
    id: 'p1',
    code: 'K-1',
    title: 'Casa',
    property_type: 'apartment',
    purpose: 'rent',
    province: 'Luanda',
    city: 'Luanda',
    address_line: null,
    status: 'active',
    notes: null,
    price_aoa: 100,
    bedrooms: 2,
    cover_image_url: null,
    is_demo: false,
    created_at: '2026-09-01T00:00:00Z',
    review_status: 'approved',
    ...overrides,
  };
}

describe('isHousingRowPubliclyVisible (D3 DEMO INTERNAL ONLY)', () => {
  it('hides demo inventory from Mercado', () => {
    expect(isHousingRowPubliclyVisible(row({ is_demo: true }))).toBe(false);
  });

  it('shows approved real listings', () => {
    expect(isHousingRowPubliclyVisible(row())).toBe(true);
  });

  it('hides drafts and unapproved listings', () => {
    expect(isHousingRowPubliclyVisible(row({ status: 'draft' }))).toBe(false);
    expect(isHousingRowPubliclyVisible(row({ review_status: 'in_review' }))).toBe(false);
  });
});
