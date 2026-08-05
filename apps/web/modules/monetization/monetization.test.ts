import { describe, expect, it } from 'vitest';
import { PARTNER_PLAN_OPTIONS, PROVIDER_CATEGORIES, URGENCY_OPTIONS } from './lib/catalog';

describe('monetization catalogs', () => {
  it('exposes four urgency bands for smart move', () => {
    expect(URGENCY_OPTIONS).toHaveLength(4);
    expect(URGENCY_OPTIONS.map((o) => o.value)).toEqual([
      'planned_90',
      'priority_60',
      'urgent_30',
      'emergency_14',
    ]);
  });

  it('lists partner bronze/silver/gold codes', () => {
    expect(PARTNER_PLAN_OPTIONS.map((p) => p.code)).toEqual([
      'partner.bronze.monthly',
      'partner.silver.monthly',
      'partner.gold.monthly',
    ]);
  });

  it('includes marketplace categories', () => {
    expect(PROVIDER_CATEGORIES.some((c) => c.value === 'cleaning')).toBe(true);
    expect(PROVIDER_CATEGORIES.some((c) => c.value === 'moving')).toBe(true);
  });
});
