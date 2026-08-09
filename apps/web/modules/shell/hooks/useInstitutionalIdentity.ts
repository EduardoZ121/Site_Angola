'use client';

import { useEffect, useState } from 'react';
import {
  getIdentity,
  type InstitutionalIdentity,
} from '@/modules/kocc/services/institutional-client';

let cached: InstitutionalIdentity | null = null;
let inflight: Promise<InstitutionalIdentity | null> | null = null;

async function loadOnce(): Promise<InstitutionalIdentity | null> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    const result = await getIdentity();
    if (result.ok) {
      cached = result.data;
      return result.data;
    }
    return null;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Clears module cache (e.g. after logout / role change). */
export function resetInstitutionalIdentityCache() {
  cached = null;
  inflight = null;
}

/**
 * Loads `get_institutional_identity` once per session for chrome badges.
 */
export function useInstitutionalIdentity(enabled = true) {
  const [identity, setIdentity] = useState<InstitutionalIdentity | null>(cached);
  const [loaded, setLoaded] = useState(!!cached);

  useEffect(() => {
    if (!enabled) {
      setIdentity(null);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    void loadOnce().then((data) => {
      if (cancelled) return;
      setIdentity(data);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { identity, loaded };
}
