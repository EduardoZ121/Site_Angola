import { describe, expect, it } from 'vitest';
import {
  KUTEKA_PAY_ADAPTER_CODES,
  KUTEKA_PAY_MODULE_CODES,
  financeGrantCreditsSchema,
  financeQuoteSchema,
  financeSandboxPaymentSchema,
  kutekaPayCreateIntentSchema,
  kutekaPayFailSchema,
  kutekaPayIntentIdSchema,
  kutekaPaySetDefaultGatewaySchema,
  kutekaPaySimulateWebhookSchema,
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
    expect(
      financeSandboxPaymentSchema.safeParse({
        productCode: 'kuteka_plus.monthly',
        gatewayCode: 'stripe',
      }).success,
    ).toBe(false);
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

describe('kuteka pay engine validation', () => {
  it('exposes canonical module and adapter codes', () => {
    expect(KUTEKA_PAY_MODULE_CODES).toContain('smart_move');
    expect(KUTEKA_PAY_MODULE_CODES).toContain('other');
    expect(KUTEKA_PAY_ADAPTER_CODES).toEqual([
      'sandbox',
      'multicaixa',
      'emis',
      'stripe',
      'wise',
      'bank_transfer',
    ]);
  });

  it('defaults module code to other and accepts a minimal intent', () => {
    const parsed = kutekaPayCreateIntentSchema.safeParse({ productCode: 'kuteka_plus.monthly' });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.moduleCode).toBe('other');
    }
  });

  it('accepts a fully specified intent linked to a business object', () => {
    const parsed = kutekaPayCreateIntentSchema.safeParse({
      productCode: 'smart_move.open',
      moduleCode: 'smart_move',
      purpose: 'opening_fee',
      referenceType: 'smart_move_request',
      referenceId: '22222222-2222-2222-2222-222222222222',
      urgencyBand: 'urgent_30',
      gatewayCode: 'sandbox',
      idempotencyKey: 'smove-open-2026-0001',
      description: 'Mudança Inteligente — abertura',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects unknown gateway and module codes', () => {
    expect(
      kutekaPayCreateIntentSchema.safeParse({
        productCode: 'kuteka_plus.monthly',
        gatewayCode: 'paypal',
      }).success,
    ).toBe(false);
    expect(
      kutekaPayCreateIntentSchema.safeParse({
        productCode: 'kuteka_plus.monthly',
        gatewayCode: 'multicaixa',
      }).success,
    ).toBe(false);
    expect(
      kutekaPayCreateIntentSchema.safeParse({
        productCode: 'kuteka_plus.monthly',
        moduleCode: 'crypto',
      }).success,
    ).toBe(false);
  });

  it('rejects short idempotency keys', () => {
    expect(
      kutekaPayCreateIntentSchema.safeParse({ productCode: 'x.y', idempotencyKey: 'abc' }).success,
    ).toBe(false);
  });

  it('validates intent id, fail, webhook and default gateway inputs', () => {
    expect(
      kutekaPayIntentIdSchema.safeParse({
        paymentIntentId: '33333333-3333-3333-3333-333333333333',
      }).success,
    ).toBe(true);
    expect(kutekaPayIntentIdSchema.safeParse({ paymentIntentId: 'nope' }).success).toBe(false);
    expect(
      kutekaPayFailSchema.safeParse({
        paymentIntentId: '33333333-3333-3333-3333-333333333333',
        code: 'card_declined',
        message: 'Cartão recusado',
      }).success,
    ).toBe(true);
    expect(
      kutekaPaySimulateWebhookSchema.safeParse({
        paymentIntentId: '33333333-3333-3333-3333-333333333333',
        event: 'succeeded',
      }).success,
    ).toBe(true);
    expect(
      kutekaPaySimulateWebhookSchema.safeParse({
        paymentIntentId: '33333333-3333-3333-3333-333333333333',
        event: 'refunded',
      }).success,
    ).toBe(false);
    expect(kutekaPaySetDefaultGatewaySchema.safeParse({ gatewayCode: 'sandbox' }).success).toBe(
      true,
    );
    expect(kutekaPaySetDefaultGatewaySchema.safeParse({ gatewayCode: 'multicaixa' }).success).toBe(
      false,
    );
  });
});
