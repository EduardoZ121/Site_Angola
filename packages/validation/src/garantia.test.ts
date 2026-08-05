import { describe, expect, it } from 'vitest';
import {
  GARANTIA_EVENT_TYPES,
  GARANTIA_STATUSES,
  garantiaCancelSchema,
  garantiaCreateSchema,
  garantiaPaymentStatusSchema,
  garantiaSubscriptionIdSchema,
} from './garantia';

const UUID = '00000000-0000-4000-8000-000000000001';

describe('garantia state machine', () => {
  it('covers the D4 lifecycle states', () => {
    expect(GARANTIA_STATUSES).toEqual([
      'draft',
      'awaiting_payment',
      'active',
      'cancelled',
      'past_due',
      'failed',
    ]);
  });

  it('exposes payment, coverage and refund timeline events', () => {
    expect(GARANTIA_EVENT_TYPES).toContain('payment_requested');
    expect(GARANTIA_EVENT_TYPES).toContain('activated');
    expect(GARANTIA_EVENT_TYPES).toContain('refunded');
  });
});

describe('garantia schemas', () => {
  it('accepts optional property and contract references', () => {
    expect(garantiaCreateSchema.safeParse({}).success).toBe(true);
    expect(garantiaCreateSchema.safeParse({ propertyId: UUID, contractId: UUID }).success).toBe(
      true,
    );
  });

  it('rejects invalid references and subscription ids', () => {
    expect(garantiaCreateSchema.safeParse({ propertyId: 'nope' }).success).toBe(false);
    expect(garantiaSubscriptionIdSchema.safeParse({ subscriptionId: 'nope' }).success).toBe(false);
  });

  it('validates cancellation and finance payment states', () => {
    expect(
      garantiaCancelSchema.safeParse({ subscriptionId: UUID, reason: 'Já não preciso.' }).success,
    ).toBe(true);
    expect(
      garantiaPaymentStatusSchema.safeParse({
        subscriptionId: UUID,
        status: 'past_due',
        reason: 'Pagamento em atraso.',
      }).success,
    ).toBe(true);
    expect(
      garantiaPaymentStatusSchema.safeParse({ subscriptionId: UUID, status: 'active' }).success,
    ).toBe(false);
  });
});
