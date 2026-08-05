import { describe, expect, it } from 'vitest';
import {
  CONCIERGE_CATEGORIES,
  CONCIERGE_EVENT_TYPES,
  CONCIERGE_STATUSES,
  conciergeCancelSchema,
  conciergeCreateSchema,
  conciergeOperatorActionSchema,
  conciergeRequestIdSchema,
} from './concierge';

const UUID = '00000000-0000-4000-8000-000000000001';

describe('concierge state machine', () => {
  it('covers the complete D3 lifecycle', () => {
    expect(CONCIERGE_STATUSES).toEqual([
      'draft',
      'awaiting_payment',
      'active',
      'in_progress',
      'completed',
      'cancelled',
      'failed',
    ]);
  });

  it('exposes the append-only timeline events', () => {
    expect(CONCIERGE_EVENT_TYPES).toContain('started');
    expect(CONCIERGE_EVENT_TYPES).toContain('completed');
    expect(CONCIERGE_EVENT_TYPES).toContain('refunded');
  });
});

describe('concierge schemas', () => {
  it('accepts a category, notes and optional business references', () => {
    expect(CONCIERGE_CATEGORIES).toContain('contract_support');
    expect(
      conciergeCreateSchema.safeParse({
        category: 'contract_support',
        notes: 'Preciso de ajuda para compreender o meu contrato.',
        propertyId: UUID,
        contractId: UUID,
      }).success,
    ).toBe(true);
  });

  it('rejects unknown categories, short notes and invalid references', () => {
    expect(
      conciergeCreateSchema.safeParse({ category: 'unknown', notes: 'Notas suficientes.' }).success,
    ).toBe(false);
    expect(conciergeCreateSchema.safeParse({ category: 'other', notes: 'Curto' }).success).toBe(
      false,
    );
    expect(
      conciergeCreateSchema.safeParse({
        category: 'other',
        notes: 'Pedido válido com propriedade inválida.',
        propertyId: 'nope',
      }).success,
    ).toBe(false);
  });

  it('validates lifecycle actions', () => {
    expect(conciergeRequestIdSchema.safeParse({ requestId: UUID }).success).toBe(true);
    expect(
      conciergeOperatorActionSchema.safeParse({ requestId: UUID, note: 'Atendimento iniciado.' })
        .success,
    ).toBe(true);
    expect(
      conciergeCancelSchema.safeParse({ requestId: UUID, reason: 'Já não preciso.' }).success,
    ).toBe(true);
    expect(conciergeRequestIdSchema.safeParse({ requestId: 'nope' }).success).toBe(false);
  });
});
