import { describe, expect, it } from 'vitest';
import {
  financeGrantCreditsSchema,
  financeQuoteSchema,
  financeSandboxPaymentSchema,
} from './finance';

describe('finance validation', () => {
  it('quotes product codes', () => {
    const ok = financeQuoteSchema.safeParse({
      productCode: 'smart_move.open',
      urgencyBand: 'urgent_30',
    });
    expect(ok.success).toBe(true);
  });

  it('validates sandbox payment', () => {
    const ok = financeSandboxPaymentSchema.safeParse({
      productCode: 'kuteka_plus.monthly',
      gatewayCode: 'sandbox',
    });
    expect(ok.success).toBe(true);
  });

  it('requires positive credit grant', () => {
    expect(financeGrantCreditsSchema.safeParse({ userId: 'x', amount: -1 }).success).toBe(false);
    const ok = financeGrantCreditsSchema.safeParse({
      userId: '11111111-1111-1111-1111-111111111111',
      amount: 1000,
      reason: 'Campanha',
    });
    expect(ok.success).toBe(true);
  });
});
