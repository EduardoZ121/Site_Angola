/**
 * Pure helper mirroring SQL notify_availability_request_clients trigger gate.
 * Used by unit tests — DB trigger lives in 0047_availability_notify_on_publish.sql.
 */

export type AvailabilityNotifyPropertyTransition = {
  oldStatus: string | null;
  newStatus: string | null;
  oldLifecycle: string | null;
  newLifecycle: string | null;
  deletedAt?: string | null;
};

/** True when property update should fan-out availability notifications. */
export function shouldNotifyAvailabilityOnPropertyUpdate(
  transition: AvailabilityNotifyPropertyTransition,
): boolean {
  if (transition.deletedAt) return false;
  const becameActive =
    transition.newStatus === 'active' && transition.oldStatus !== 'active';
  const becamePublicado =
    transition.newLifecycle === 'publicado' && transition.oldLifecycle !== 'publicado';
  return becameActive || becamePublicado;
}

export type OpenAvailabilityRequest = {
  id: string;
  clientId: string;
  status: 'open' | 'notified' | 'closed';
};

/** Pure fan-out plan: which open requests become notified (idempotent filter). */
export function planAvailabilityNotifyFanout(
  requests: OpenAvailabilityRequest[],
): { requestId: string; clientId: string }[] {
  return requests
    .filter((r) => r.status === 'open')
    .map((r) => ({ requestId: r.id, clientId: r.clientId }));
}
