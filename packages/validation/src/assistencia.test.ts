import { describe, expect, it } from 'vitest';
import {
  ASSISTENCIA_CATEGORIES,
  ASSISTENCIA_EVENT_TYPES,
  ASSISTENCIA_STATUSES,
  ASSISTENCIA_URGENCIES,
  assistenciaCancelSchema,
  assistenciaCreateSchema,
  assistenciaOperatorActionSchema,
  assistenciaRequestIdSchema,
} from './assistencia';

const UUID = '00000000-0000-4000-8000-000000000001';

describe('assistencia state machine', () => {
  it('covers the complete D5 lifecycle', () => {
    expect(ASSISTENCIA_STATUSES).toEqual([
      'draft',
      'awaiting_payment',
      'active',
      'in_progress',
      'completed',
      'cancelled',
      'failed',
    ]);
  });

  it('exposes payment, operation and refund events', () => {
    expect(ASSISTENCIA_EVENT_TYPES).toContain('payment_requested');
    expect(ASSISTENCIA_EVENT_TYPES).toContain('started');
    expect(ASSISTENCIA_EVENT_TYPES).toContain('refunded');
  });
});

describe('assistencia schemas', () => {
  it('accepts category, urgency, notes and an optional property', () => {
    expect(ASSISTENCIA_CATEGORIES).toContain('plumbing');
    expect(ASSISTENCIA_URGENCIES).toEqual(['urgent', 'emergency']);
    expect(
      assistenciaCreateSchema.safeParse({
        category: 'plumbing',
        urgency: 'emergency',
        notes: 'Há uma ruptura de água activa na cozinha.',
        propertyId: UUID,
      }).success,
    ).toBe(true);
  });

  it('rejects unknown values, short notes and invalid properties', () => {
    expect(
      assistenciaCreateSchema.safeParse({
        category: 'unknown',
        urgency: 'urgent',
        notes: 'Notas suficientes.',
      }).success,
    ).toBe(false);
    expect(
      assistenciaCreateSchema.safeParse({
        category: 'gas',
        urgency: 'later',
        notes: 'Sinto cheiro a gás junto à entrada.',
      }).success,
    ).toBe(false);
    expect(
      assistenciaCreateSchema.safeParse({
        category: 'other',
        urgency: 'urgent',
        notes: 'Curto',
        propertyId: 'nope',
      }).success,
    ).toBe(false);
  });

  it('validates lifecycle actions', () => {
    expect(assistenciaRequestIdSchema.safeParse({ requestId: UUID }).success).toBe(true);
    expect(
      assistenciaOperatorActionSchema.safeParse({
        requestId: UUID,
        note: 'Prestador contactado.',
      }).success,
    ).toBe(true);
    expect(
      assistenciaCancelSchema.safeParse({ requestId: UUID, reason: 'Situação resolvida.' }).success,
    ).toBe(true);
    expect(assistenciaRequestIdSchema.safeParse({ requestId: 'nope' }).success).toBe(false);
  });
});
