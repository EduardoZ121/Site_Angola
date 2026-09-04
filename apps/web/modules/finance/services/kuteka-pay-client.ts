'use client';

import {
  kutekaPayCreateIntentSchema,
  kutekaPayFailSchema,
  kutekaPayIntentIdSchema,
  kutekaPaySetDefaultGatewaySchema,
  kutekaPaySimulateWebhookSchema,
  type KutekaPayCreateIntentInput,
  type KutekaPayFailInput,
  type KutekaPayIntentIdInput,
  type KutekaPaySetDefaultGatewayInput,
  type KutekaPaySimulateWebhookInput,
} from '@kuteka/validation';
import { createBrowserClient } from '@/lib/supabase/client';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { getFinanceCopy } from '../content';

/**
 * Kuteka Pay — cliente do motor de pagamento unificado.
 *
 * Todos os módulos (renda, reservas, mudança inteligente, concierge, contratos,
 * avaliações, prestadores, futuros) usam estas RPCs. Nenhum módulo chama SDKs de
 * gateway directamente. O payment intent é a única fonte de verdade.
 */

function copy() {
  return getFinanceCopy(resolveUiLocale()).payEngineErrors;
}

export type KutekaPayClientAction =
  | { type: 'auto_capture_ready' }
  | { type: 'gateway_redirect'; gatewayCode?: string }
  | { type: 'already_captured' };

export type KutekaPayIntentResult = {
  ok: true;
  paymentIntentId: string;
  amount: number;
  currency: string;
  gateway: string;
  sandbox: boolean;
  clientAction: KutekaPayClientAction;
  idempotent: boolean;
  raw: Record<string, unknown>;
};

export type KutekaPayIntentRow = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  module_code: string;
  purpose: string | null;
  reference_type: string | null;
  reference_id: string | null;
  gateway_code: string | null;
  adapter_code: string;
  sandbox: boolean;
  created_at: string;
  captured_at: string | null;
  failed_at: string | null;
};

export type KutekaPayEventRow = {
  id: string;
  payment_intent_id: string;
  event_type: string;
  adapter_code: string | null;
  status_after: string | null;
  created_at: string;
};

export type KutekaPayAdapterHealth = {
  code: string;
  name: string;
  active: boolean;
  sandbox: boolean;
  is_default: boolean;
  priority: number;
  module_allowlist: string[] | null;
  intents: number;
  succeeded: number;
  failed: number;
  pending: number;
};

export async function createIntent(
  input: KutekaPayCreateIntentInput,
): Promise<{ ok: true; data: KutekaPayIntentResult } | { ok: false; message: string }> {
  const parsed = kutekaPayCreateIntentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy().createError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kuteka_pay_create_intent', {
      p_product_code: parsed.data.productCode,
      p_module_code: parsed.data.moduleCode,
      p_purpose: parsed.data.purpose ?? null,
      p_reference_type: parsed.data.referenceType ?? null,
      p_reference_id: parsed.data.referenceId ?? null,
      p_urgency_band: parsed.data.urgencyBand ?? null,
      p_gateway_code: 'sandbox',
      p_idempotency_key: parsed.data.idempotencyKey ?? null,
      p_description: parsed.data.description ?? null,
      p_metadata: {},
      p_amount_override: parsed.data.amountOverride ?? null,
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy().createError };
    const raw = data as Record<string, unknown>;
    return {
      ok: true,
      data: {
        ok: true,
        paymentIntentId: String(raw.paymentIntentId ?? ''),
        amount: Number(raw.amount ?? 0),
        currency: String(raw.currency ?? 'AOA'),
        gateway: String(raw.gateway ?? 'sandbox'),
        sandbox: Boolean(raw.sandbox ?? true),
        clientAction: (raw.clientAction as KutekaPayClientAction) ?? { type: 'auto_capture_ready' },
        idempotent: Boolean(raw.idempotent ?? false),
        raw,
      },
    };
  } catch {
    return { ok: false, message: copy().createError };
  }
}

export async function capture(
  input: KutekaPayIntentIdInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = kutekaPayIntentIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy().captureError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kuteka_pay_capture', {
      p_intent_id: parsed.data.paymentIntentId,
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy().captureError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy().captureError };
  }
}

export async function fail(
  input: KutekaPayFailInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = kutekaPayFailSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy().failError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kuteka_pay_fail', {
      p_intent_id: parsed.data.paymentIntentId,
      p_code: parsed.data.code ?? null,
      p_message: parsed.data.message ?? null,
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy().failError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy().failError };
  }
}

export async function cancel(
  input: KutekaPayIntentIdInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = kutekaPayIntentIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy().cancelError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kuteka_pay_cancel', {
      p_intent_id: parsed.data.paymentIntentId,
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy().cancelError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy().cancelError };
  }
}

export async function status(
  input: KutekaPayIntentIdInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = kutekaPayIntentIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy().statusError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kuteka_pay_status', {
      p_intent_id: parsed.data.paymentIntentId,
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy().statusError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy().statusError };
  }
}

export async function simulateWebhook(
  input: KutekaPaySimulateWebhookInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = kutekaPaySimulateWebhookSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy().webhookError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kuteka_pay_simulate_webhook', {
      p_intent_id: parsed.data.paymentIntentId,
      p_event: parsed.data.event,
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy().webhookError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy().webhookError };
  }
}

export async function setDefaultGateway(
  input: KutekaPaySetDefaultGatewayInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = kutekaPaySetDefaultGatewaySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy().saveError };
  }
  try {
    const client = createBrowserClient();
    if (parsed.data.gatewayCode !== 'sandbox') {
      return { ok: false, message: copy().saveError };
    }
    const { error } = await client.rpc('kuteka_pay_set_default_gateway', {
      p_code: 'sandbox',
    });
    if (error) return { ok: false, message: error.message || copy().saveError };
    return { ok: true };
  } catch {
    return { ok: false, message: copy().saveError };
  }
}

export async function fetchAdapterHealth(): Promise<
  { ok: true; data: KutekaPayAdapterHealth[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('kuteka_pay_adapter_health');
    if (error || !data) return { ok: false, message: copy().loadError };
    const raw = data as { adapters?: KutekaPayAdapterHealth[] };
    return { ok: true, data: raw.adapters ?? [] };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

export async function listIntents(
  limit = 40,
): Promise<{ ok: true; data: KutekaPayIntentRow[] } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('finance_payment_intents')
      .select(
        'id, status, amount, currency, module_code, purpose, reference_type, reference_id, gateway_code, adapter_code, sandbox, created_at, captured_at, failed_at',
      )
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return { ok: false, message: copy().loadError };
    return { ok: true, data: (data as KutekaPayIntentRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

export async function listPayEvents(
  intentId: string,
  limit = 40,
): Promise<{ ok: true; data: KutekaPayEventRow[] } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('finance_pay_events')
      .select('id, payment_intent_id, event_type, adapter_code, status_after, created_at')
      .eq('payment_intent_id', intentId)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) return { ok: false, message: copy().loadError };
    return { ok: true, data: (data as KutekaPayEventRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

/**
 * Helper de alto nível: cria um intent e, em sandbox (auto_capture_ready),
 * captura-o de imediato. Os módulos podem usar isto até haver gateway real.
 */
export async function createAndSettle(
  input: KutekaPayCreateIntentInput,
): Promise<
  | { ok: true; paymentIntentId: string; invoiceNumber: string | null; captured: boolean }
  | { ok: false; message: string }
> {
  const created = await createIntent(input);
  if (!created.ok) return created;
  const intentId = created.data.paymentIntentId;
  if (created.data.clientAction.type !== 'auto_capture_ready') {
    return { ok: true, paymentIntentId: intentId, invoiceNumber: null, captured: false };
  }
  const captured = await capture({ paymentIntentId: intentId });
  if (!captured.ok) return captured;
  return {
    ok: true,
    paymentIntentId: intentId,
    invoiceNumber: captured.data.invoiceNumber != null ? String(captured.data.invoiceNumber) : null,
    captured: true,
  };
}
