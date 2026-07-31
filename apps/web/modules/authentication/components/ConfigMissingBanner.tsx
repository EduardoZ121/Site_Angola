'use client';

import { useSyncExternalStore } from 'react';
import { getAuthCopy } from '../content';
import { isPublicSupabaseConfigured } from '../lib/public-config';

function subscribe() {
  return () => undefined;
}

function getSnapshot() {
  return isPublicSupabaseConfigured();
}

function getServerSnapshot() {
  return false;
}

/** Client banner — respects runtime `kuteka-config.js` after hydration. */
export function ConfigMissingBanner() {
  const configured = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const copy = getAuthCopy();

  if (configured) return null;

  return (
    <p
      role="status"
      className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
    >
      {copy.common.configMissing}
    </p>
  );
}
