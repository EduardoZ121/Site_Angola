'use client';

import {
  garantiaCancelSchema,
  garantiaCreateSchema,
  garantiaPaymentStatusSchema,
  garantiaSubscriptionIdSchema,
  type GarantiaCancelInput,
  type GarantiaCreateInput,
  type GarantiaPaymentStatusInput,
  type GarantiaSubscriptionIdInput,
} from '@kuteka/validation';
import { createBrowserClient } from '@/lib/supabase/client';
import { mapIdentityGateMessage } from '@/modules/identidade/lib/map-identity-gate';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { getMonetizationCopy } from '../content';

function copy() {
  const locale = resolveUiLocale();
  const monetization = getMonetizationCopy(locale);
  return {
    loadError: monetization.garantia.loadError,
    actionError: monetization.common.actionError,
    locale,
  };
}

export type GarantiaSubscription = {
  id: string;
  client_id: string;
  property_id: string | null;
  contract_id: string | null;
  status: string;
  payment_intent_id: string | null;
  monthly_amount_aoa: number | null;
  coverage_starts_at: string | null;
  coverage_ends_at: string | null;
  cancelled_at: string | null;
  past_due_at: string | null;
  failed_at: string | null;
  status_reason: string | null;
  created_at: string;
};

export type GarantiaEvent = {
  id: string;
  subscription_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string;
};

export type GarantiaContext = { canOperate: boolean };

const SUBSCRIPTION_SELECT =
  'id,client_id,property_id,contract_id,status,payment_intent_id,monthly_amount_aoa,coverage_starts_at,coverage_ends_at,cancelled_at,past_due_at,failed_at,status_reason,created_at';

type ActionResult = { ok: true; data: Record<string, unknown> } | { ok: false; message: string };

async function callRpc(fn: string, args: Record<string, unknown>): Promise<ActionResult> {
  const c = copy();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc(fn, args);
    if (error || !data)
      return {
        ok: false,
        message: mapIdentityGateMessage(error?.message, c.actionError, c.locale),
      };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: c.actionError };
  }
}

export async function fetchGarantiaContext(): Promise<
  { ok: true; data: GarantiaContext } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('garantia_my_context');
    if (error || !data) return { ok: false, message: error?.message || copy().loadError };
    const raw = data as { canOperate?: boolean };
    return { ok: true, data: { canOperate: Boolean(raw.canOperate) } };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

export async function listGarantiaSubscriptions(): Promise<
  { ok: true; data: GarantiaSubscription[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('garantia_subscriptions')
      .select(SUBSCRIPTION_SELECT)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) return { ok: false, message: error.message || copy().loadError };
    return { ok: true, data: (data ?? []) as GarantiaSubscription[] };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

export async function listGarantiaEvents(
  subscriptionId: string,
): Promise<{ ok: true; data: GarantiaEvent[] } | { ok: false; message: string }> {
  const parsed = garantiaSubscriptionIdSchema.safeParse({ subscriptionId });
  if (!parsed.success) return { ok: false, message: copy().actionError };
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('garantia_events')
      .select('id,subscription_id,event_type,from_status,to_status,note,created_at')
      .eq('subscription_id', parsed.data.subscriptionId)
      .order('created_at', { ascending: true })
      .limit(50);
    if (error) return { ok: false, message: error.message || copy().loadError };
    return { ok: true, data: (data ?? []) as GarantiaEvent[] };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

export async function createGarantiaSubscription(
  input: GarantiaCreateInput,
): Promise<ActionResult> {
  const parsed = garantiaCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy().actionError };
  }
  return callRpc('create_garantia_subscription', {
    p_property_id: parsed.data.propertyId ?? null,
    p_contract_id: parsed.data.contractId ?? null,
  });
}

export async function activateGarantia(input: GarantiaSubscriptionIdInput): Promise<ActionResult> {
  const parsed = garantiaSubscriptionIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy().actionError };
  return callRpc('garantia_activate', { p_subscription_id: parsed.data.subscriptionId });
}

export async function cancelGarantia(input: GarantiaCancelInput): Promise<ActionResult> {
  const parsed = garantiaCancelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy().actionError };
  return callRpc('garantia_cancel', {
    p_subscription_id: parsed.data.subscriptionId,
    p_reason: parsed.data.reason ?? null,
  });
}

export async function markGarantiaPaymentStatus(
  input: GarantiaPaymentStatusInput,
): Promise<ActionResult> {
  const parsed = garantiaPaymentStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy().actionError };
  return callRpc('garantia_mark_payment_status', {
    p_subscription_id: parsed.data.subscriptionId,
    p_status: parsed.data.status,
    p_reason: parsed.data.reason ?? null,
  });
}
