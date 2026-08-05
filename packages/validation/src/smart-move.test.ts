import { describe, expect, it } from 'vitest';
import {
  SMART_MOVE_EVENT_TYPES,
  SMART_MOVE_STATUSES,
  smartMoveCancelSchema,
  smartMoveCreateSchema,
  smartMoveMatchSchema,
  smartMoveRejectSchema,
  smartMoveRequestIdSchema,
} from './smart-move';

const UUID = '00000000-0000-4000-8000-000000000001';

describe('smart move state machine', () => {
  it('covers the full N5 lifecycle', () => {
    expect(SMART_MOVE_STATUSES).toEqual([
      'draft',
      'awaiting_payment',
      'active',
      'matched',
      'completed',
      'cancelled',
      'failed',
    ]);
  });

  it('exposes the append-only timeline event types', () => {
    expect(SMART_MOVE_EVENT_TYPES).toContain('matched');
    expect(SMART_MOVE_EVENT_TYPES).toContain('refunded');
    expect(SMART_MOVE_EVENT_TYPES).toContain('sla_breached');
  });
});

describe('smart move schemas', () => {
  it('requires a valid urgency and ISO exit date', () => {
    expect(
      smartMoveCreateSchema.safeParse({ urgencyBand: 'urgent_30', targetExitOn: '2026-09-01' })
        .success,
    ).toBe(true);
    expect(
      smartMoveCreateSchema.safeParse({ urgencyBand: 'nope', targetExitOn: '2026-09-01' }).success,
    ).toBe(false);
    expect(
      smartMoveCreateSchema.safeParse({ urgencyBand: 'urgent_30', targetExitOn: '01/09/2026' })
        .success,
    ).toBe(false);
  });

  it('requires a request id for lifecycle actions', () => {
    expect(smartMoveRequestIdSchema.safeParse({ requestId: UUID }).success).toBe(true);
    expect(smartMoveRequestIdSchema.safeParse({ requestId: 'nope' }).success).toBe(false);
  });

  it('accepts an optional matched property and notes', () => {
    expect(smartMoveMatchSchema.safeParse({ requestId: UUID }).success).toBe(true);
    expect(
      smartMoveMatchSchema.safeParse({
        requestId: UUID,
        matchedPropertyId: UUID,
        notes: 'Apartamento T2 no Kilamba',
      }).success,
    ).toBe(true);
    expect(
      smartMoveMatchSchema.safeParse({ requestId: UUID, matchedPropertyId: 'x' }).success,
    ).toBe(false);
  });

  it('accepts optional reasons on reject and cancel', () => {
    expect(smartMoveRejectSchema.safeParse({ requestId: UUID }).success).toBe(true);
    expect(
      smartMoveCancelSchema.safeParse({ requestId: UUID, reason: 'Mudei de ideias' }).success,
    ).toBe(true);
  });
});
