import { describe, expect, it } from 'vitest';
import {
  planAvailabilityNotifyFanout,
  shouldNotifyAvailabilityOnPropertyUpdate,
} from './availability-notify';

describe('shouldNotifyAvailabilityOnPropertyUpdate', () => {
  it('fires when status becomes active', () => {
    expect(
      shouldNotifyAvailabilityOnPropertyUpdate({
        oldStatus: 'draft',
        newStatus: 'active',
        oldLifecycle: 'em_preparacao',
        newLifecycle: 'em_preparacao',
      }),
    ).toBe(true);
  });

  it('fires when lifecycle becomes publicado', () => {
    expect(
      shouldNotifyAvailabilityOnPropertyUpdate({
        oldStatus: 'active',
        newStatus: 'active',
        oldLifecycle: 'em_analise_admin',
        newLifecycle: 'publicado',
      }),
    ).toBe(true);
  });

  it('is idempotent when already active/publicado', () => {
    expect(
      shouldNotifyAvailabilityOnPropertyUpdate({
        oldStatus: 'active',
        newStatus: 'active',
        oldLifecycle: 'publicado',
        newLifecycle: 'publicado',
      }),
    ).toBe(false);
  });

  it('skips deleted rows', () => {
    expect(
      shouldNotifyAvailabilityOnPropertyUpdate({
        oldStatus: 'draft',
        newStatus: 'active',
        oldLifecycle: null,
        newLifecycle: 'publicado',
        deletedAt: '2026-01-01T00:00:00Z',
      }),
    ).toBe(false);
  });
});

describe('planAvailabilityNotifyFanout', () => {
  it('only includes open requests', () => {
    expect(
      planAvailabilityNotifyFanout([
        { id: '1', clientId: 'a', status: 'open' },
        { id: '2', clientId: 'b', status: 'notified' },
        { id: '3', clientId: 'c', status: 'closed' },
        { id: '4', clientId: 'd', status: 'open' },
      ]),
    ).toEqual([
      { requestId: '1', clientId: 'a' },
      { requestId: '4', clientId: 'd' },
    ]);
  });
});
