import { describe, expect, it } from 'vitest';
import { FINANCE_URGENCY_BANDS } from '@kuteka/validation';
import { formatAoaAmount } from './format';

describe('finance helpers', () => {
  it('exposes urgency bands for smart move', () => {
    expect(FINANCE_URGENCY_BANDS).toContain('planned_90');
    expect(FINANCE_URGENCY_BANDS).toContain('emergency_14');
  });

  it('formats AOA amounts', () => {
    const text = formatAoaAmount(5000, 'AOA');
    expect(text.includes('5') || text.includes('5000')).toBe(true);
  });
});
