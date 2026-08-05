import { describe, expect, it } from 'vitest';
import {
  ORDER_STATUS_LABELS,
  PARTNER_PLAN_OPTIONS,
  PROVIDER_CATEGORIES,
  URGENCY_OPTIONS,
  orderStatusLabel,
  orderStatusTone,
} from './lib/catalog';

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

  it('labels every operational order status', () => {
    expect(Object.keys(ORDER_STATUS_LABELS)).toEqual([
      'requested',
      'quoted',
      'accepted',
      'in_progress',
      'completed',
      'cancelled',
      'disputed',
    ]);
    expect(orderStatusLabel('in_progress')).toBe('Em execução');
    expect(orderStatusLabel('unknown')).toBe('unknown');
  });

  it('maps status to a badge tone', () => {
    expect(orderStatusTone('completed')).toBe('success');
    expect(orderStatusTone('cancelled')).toBe('danger');
    expect(orderStatusTone('requested')).toBe('warning');
    expect(orderStatusTone('accepted')).toBe('default');
  });
});
