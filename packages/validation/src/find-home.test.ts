import { describe, expect, it } from 'vitest';
import {
  FIND_HOME_EVENT_TYPES,
  FIND_HOME_STATUSES,
  findHomeCancelSchema,
  findHomeCreateSchema,
  findHomeMatchSchema,
  findHomeRejectSchema,
  findHomeRequestIdSchema,
} from './find-home';

const UUID = '00000000-0000-4000-8000-000000000001';

describe('find home state machine', () => {
  it('covers the full lifecycle', () => {
    expect(FIND_HOME_STATUSES).toEqual([
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
    expect(FIND_HOME_EVENT_TYPES).toContain('matched');
    expect(FIND_HOME_EVENT_TYPES).toContain('refunded');
    expect(FIND_HOME_EVENT_TYPES).toContain('sla_breached');
  });
});

describe('find home schemas', () => {
  it('accepts optional preferences and a valid typology', () => {
    expect(findHomeCreateSchema.safeParse({}).success).toBe(true);
    expect(
      findHomeCreateSchema.safeParse({
        province: 'Luanda',
        municipality: 'Belas',
        typology: 't2',
        budgetMax: 250000,
        notes: 'Perto de escola',
      }).success,
    ).toBe(true);
    expect(findHomeCreateSchema.safeParse({ typology: 't99' }).success).toBe(false);
    expect(findHomeCreateSchema.safeParse({ budgetMax: -1 }).success).toBe(false);
  });

  it('requires a request id for lifecycle actions', () => {
    expect(findHomeRequestIdSchema.safeParse({ requestId: UUID }).success).toBe(true);
    expect(findHomeRequestIdSchema.safeParse({ requestId: 'nope' }).success).toBe(false);
  });

  it('accepts an optional matched property and notes', () => {
    expect(findHomeMatchSchema.safeParse({ requestId: UUID }).success).toBe(true);
    expect(
      findHomeMatchSchema.safeParse({
        requestId: UUID,
        matchedPropertyId: UUID,
        notes: 'Apartamento T2 no Kilamba',
      }).success,
    ).toBe(true);
    expect(findHomeMatchSchema.safeParse({ requestId: UUID, matchedPropertyId: 'x' }).success).toBe(
      false,
    );
  });

  it('accepts optional reasons on reject and cancel', () => {
    expect(findHomeRejectSchema.safeParse({ requestId: UUID }).success).toBe(true);
    expect(
      findHomeCancelSchema.safeParse({ requestId: UUID, reason: 'Mudei de ideias' }).success,
    ).toBe(true);
  });
});
