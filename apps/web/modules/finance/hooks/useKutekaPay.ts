'use client';

import { useCallback, useState } from 'react';
import type { KutekaPayCreateIntentInput } from '@kuteka/validation';
import {
  capture,
  cancel,
  createAndSettle,
  createIntent,
  status,
  type KutekaPayIntentResult,
} from '../services/kuteka-pay-client';

/**
 * useKutekaPay — hook partilhado para qualquer módulo iniciar pagamentos via o
 * motor unificado Kuteka Pay. Encapsula estado de ocupado/erro e reexpõe as
 * operações do cliente. Nenhum módulo fala com SDKs de gateway directamente.
 */
export function useKutekaPay() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastIntent, setLastIntent] = useState<KutekaPayIntentResult | null>(null);

  const start = useCallback(async (input: KutekaPayCreateIntentInput) => {
    setBusy(true);
    setError(null);
    const res = await createIntent(input);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return res;
    }
    setLastIntent(res.data);
    return res;
  }, []);

  const settle = useCallback(async (input: KutekaPayCreateIntentInput) => {
    setBusy(true);
    setError(null);
    const res = await createAndSettle(input);
    setBusy(false);
    if (!res.ok) setError(res.message);
    return res;
  }, []);

  return { busy, error, lastIntent, start, settle, capture, cancel, status, setError };
}
