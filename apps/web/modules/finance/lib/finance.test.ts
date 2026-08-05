import { describe, expect, it } from 'vitest';
import {
  FINANCE_CRM_ACCOUNT_TYPES,
  FINANCE_EXPORT_FORMATS,
  FINANCE_REFUND_MODES,
  FINANCE_URGENCY_BANDS,
  financeCreateRefundSchema,
  financeRedeemCreditsSchema,
  financeRunReconciliationSchema,
  financeUpsertProductSchema,
} from '@kuteka/validation';
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

describe('finance infra fase A schemas', () => {
  it('lists refund modes, crm types and export formats', () => {
    expect(FINANCE_REFUND_MODES).toEqual(['credits', 'gateway', 'adjustment']);
    expect(FINANCE_CRM_ACCOUNT_TYPES).toContain('investor');
    expect(FINANCE_EXPORT_FORMATS).toContain('csv');
  });

  it('validates redeem credits input and rejects non-positive amounts', () => {
    expect(financeRedeemCreditsSchema.safeParse({ amount: 100 }).success).toBe(true);
    expect(financeRedeemCreditsSchema.safeParse({ amount: 0 }).success).toBe(false);
  });

  it('defaults refund mode to credits', () => {
    const parsed = financeCreateRefundSchema.safeParse({
      ledgerEntryId: '00000000-0000-0000-0000-000000000000',
      amount: 500,
      reason: 'Teste',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.mode).toBe('credits');
  });

  it('requires ISO dates for reconciliation', () => {
    expect(
      financeRunReconciliationSchema.safeParse({
        periodStart: '2026-01-01',
        periodEnd: '2026-01-31',
      }).success,
    ).toBe(true);
    expect(
      financeRunReconciliationSchema.safeParse({ periodStart: 'ontem', periodEnd: 'hoje' }).success,
    ).toBe(false);
  });

  it('applies product defaults', () => {
    const parsed = financeUpsertProductSchema.safeParse({
      code: 'concierge.request',
      name: 'Concierge',
      category: 'other',
      pricingModel: 'fixed',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.currency).toBe('AOA');
      expect(parsed.data.chargeEvent).toBe('on_purchase');
    }
  });
});
