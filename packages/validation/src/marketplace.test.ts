import { describe, expect, it } from 'vitest';
import {
  MARKETPLACE_ORDER_STATUSES,
  marketplaceCreateOrderSchema,
  marketplacePayOrderSchema,
  marketplaceRateOrderSchema,
  marketplaceSubmitQuoteSchema,
} from './marketplace';

const UUID = '00000000-0000-4000-8000-000000000001';

describe('marketplace order state machine', () => {
  it('covers the full operational lifecycle', () => {
    expect(MARKETPLACE_ORDER_STATUSES).toEqual([
      'requested',
      'quoted',
      'accepted',
      'in_progress',
      'completed',
      'cancelled',
      'disputed',
    ]);
  });
});

describe('marketplace schemas', () => {
  it('defaults sla to 48h and requires a provider', () => {
    const parsed = marketplaceCreateOrderSchema.parse({ providerId: UUID, title: 'Limpeza' });
    expect(parsed.slaHours).toBe(48);
  });

  it('rejects a title that is too short', () => {
    expect(marketplaceCreateOrderSchema.safeParse({ providerId: UUID, title: 'a' }).success).toBe(
      false,
    );
  });

  it('requires a positive quote amount', () => {
    expect(marketplaceSubmitQuoteSchema.safeParse({ orderId: UUID, amount: 0 }).success).toBe(
      false,
    );
    expect(marketplaceSubmitQuoteSchema.safeParse({ orderId: UUID, amount: 30000 }).success).toBe(
      true,
    );
  });

  it('defaults payment gateway to sandbox', () => {
    expect(marketplacePayOrderSchema.parse({ orderId: UUID }).gatewayCode).toBe('sandbox');
  });

  it('bounds rating between 1 and 5', () => {
    expect(marketplaceRateOrderSchema.safeParse({ orderId: UUID, score: 6 }).success).toBe(false);
    expect(marketplaceRateOrderSchema.safeParse({ orderId: UUID, score: 4 }).success).toBe(true);
  });
});
