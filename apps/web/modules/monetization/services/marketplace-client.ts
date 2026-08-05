'use client';

import {
  marketplaceCancelOrderSchema,
  marketplaceCreateOrderSchema,
  marketplaceOrderIdSchema,
  marketplacePayOrderSchema,
  marketplaceRateOrderSchema,
  marketplaceSubmitQuoteSchema,
  type MarketplaceCancelOrderInput,
  type MarketplaceCreateOrderInput,
  type MarketplaceOrderIdInput,
  type MarketplacePayOrderInput,
  type MarketplaceRateOrderInput,
  type MarketplaceSubmitQuoteInput,
} from '@kuteka/validation';
import { createBrowserClient } from '@/lib/supabase/client';
import { mapIdentityGateMessage } from '@/modules/identidade/lib/map-identity-gate';

/**
 * Marketplace operacional (Fase C).
 *
 * Fecha o ciclo prestador → orçamento → aceitação → execução → pagamento
 * (Kuteka Pay) → avaliação → comissão (Ledger) → SLA → histórico, reutilizando
 * a MESMA infraestrutura financeira. O pagamento passa sempre pelo motor
 * unificado Kuteka Pay (nenhum caminho de pagamento isolado).
 */

const copy = {
  loadError: 'Estamos a ter dificuldade em mostrar o marketplace. Tente novamente.',
  actionError: 'Não conseguimos concluir esta acção. Tente novamente.',
};

export type MarketplaceProviderContext = {
  id: string;
  businessName: string;
  category: string;
  isDemo: boolean;
  owned: boolean;
};

export type MarketplaceContext = {
  canManage: boolean;
  isProvider: boolean;
  providers: MarketplaceProviderContext[];
};

export type ServiceOrderDetail = {
  id: string;
  client_id: string;
  provider_id: string;
  category: string;
  title: string;
  description: string | null;
  status: string;
  amount_aoa: number | null;
  quoted_amount_aoa: number | null;
  quote_notes: string | null;
  commission_aoa: number | null;
  payment_intent_id: string | null;
  sla_hours: number | null;
  sla_due_at: string | null;
  sla_breached: boolean;
  rating_score: number | null;
  rating_comment: string | null;
  rated_at: string | null;
  accepted_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  quoted_at: string | null;
  created_at: string;
  service_providers?: { business_name: string } | { business_name: string }[] | null;
};

export type ServiceOrderEvent = {
  id: string;
  order_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string;
};

const ORDER_SELECT =
  'id,client_id,provider_id,category,title,description,status,amount_aoa,quoted_amount_aoa,quote_notes,commission_aoa,payment_intent_id,sla_hours,sla_due_at,sla_breached,rating_score,rating_comment,rated_at,accepted_at,started_at,completed_at,quoted_at,created_at,service_providers(business_name)';

export function providerName(order: ServiceOrderDetail): string {
  const sp = order.service_providers;
  if (Array.isArray(sp)) return sp[0]?.business_name ?? order.category;
  return sp?.business_name ?? order.category;
}

export async function fetchMarketplaceContext(): Promise<
  { ok: true; data: MarketplaceContext } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('marketplace_my_context');
    if (error || !data) return { ok: false, message: error?.message || copy.loadError };
    const raw = data as {
      canManage?: boolean;
      isProvider?: boolean;
      providers?: MarketplaceProviderContext[];
    };
    return {
      ok: true,
      data: {
        canManage: Boolean(raw.canManage),
        isProvider: Boolean(raw.isProvider),
        providers: raw.providers ?? [],
      },
    };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listMyOrders(): Promise<
  { ok: true; data: ServiceOrderDetail[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data: userData } = await client.auth.getUser();
    const uid = userData.user?.id ?? '';
    const { data, error } = await client
      .from('service_orders')
      .select(ORDER_SELECT)
      .eq('client_id', uid)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return { ok: false, message: error.message || copy.loadError };
    return { ok: true, data: (data ?? []) as ServiceOrderDetail[] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listProviderInbox(
  providerIds: string[],
): Promise<{ ok: true; data: ServiceOrderDetail[] } | { ok: false; message: string }> {
  if (providerIds.length === 0) return { ok: true, data: [] };
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('service_orders')
      .select(ORDER_SELECT)
      .in('provider_id', providerIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return { ok: false, message: error.message || copy.loadError };
    return { ok: true, data: (data ?? []) as ServiceOrderDetail[] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listOrderEvents(
  orderId: string,
): Promise<{ ok: true; data: ServiceOrderEvent[] } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('service_order_events')
      .select('id,order_id,event_type,from_status,to_status,note,created_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
      .limit(50);
    if (error) return { ok: false, message: error.message || copy.loadError };
    return { ok: true, data: (data ?? []) as ServiceOrderEvent[] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

type ActionResult = { ok: true; data: Record<string, unknown> } | { ok: false; message: string };

async function callRpc(fn: string, args: Record<string, unknown>): Promise<ActionResult> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc(fn, args);
    if (error || !data)
      return { ok: false, message: mapIdentityGateMessage(error?.message, copy.actionError) };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy.actionError };
  }
}

export async function createOrder(input: MarketplaceCreateOrderInput): Promise<ActionResult> {
  const parsed = marketplaceCreateOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.actionError };
  }
  return callRpc('marketplace_create_order', {
    p_provider_id: parsed.data.providerId,
    p_title: parsed.data.title,
    p_category: parsed.data.category ?? null,
    p_description: parsed.data.description ?? null,
    p_property_id: parsed.data.propertyId ?? null,
    p_sla_hours: parsed.data.slaHours,
  });
}

export async function submitQuote(input: MarketplaceSubmitQuoteInput): Promise<ActionResult> {
  const parsed = marketplaceSubmitQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.actionError };
  }
  return callRpc('marketplace_submit_quote', {
    p_order_id: parsed.data.orderId,
    p_amount: parsed.data.amount,
    p_notes: parsed.data.notes ?? null,
  });
}

export async function acceptQuote(input: MarketplaceOrderIdInput): Promise<ActionResult> {
  const parsed = marketplaceOrderIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy.actionError };
  return callRpc('marketplace_accept_quote', { p_order_id: parsed.data.orderId });
}

export async function startOrder(input: MarketplaceOrderIdInput): Promise<ActionResult> {
  const parsed = marketplaceOrderIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy.actionError };
  return callRpc('marketplace_start_order', { p_order_id: parsed.data.orderId });
}

export async function completeOrder(input: MarketplaceOrderIdInput): Promise<ActionResult> {
  const parsed = marketplaceOrderIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy.actionError };
  return callRpc('marketplace_complete_order', { p_order_id: parsed.data.orderId });
}

export async function payOrder(input: MarketplacePayOrderInput): Promise<ActionResult> {
  const parsed = marketplacePayOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy.actionError };
  return callRpc('marketplace_pay_order', {
    p_order_id: parsed.data.orderId,
    p_gateway_code: parsed.data.gatewayCode,
  });
}

export async function cancelOrder(input: MarketplaceCancelOrderInput): Promise<ActionResult> {
  const parsed = marketplaceCancelOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy.actionError };
  return callRpc('marketplace_cancel_order', {
    p_order_id: parsed.data.orderId,
    p_reason: parsed.data.reason ?? null,
  });
}

export async function rateOrder(input: MarketplaceRateOrderInput): Promise<ActionResult> {
  const parsed = marketplaceRateOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.actionError };
  }
  return callRpc('marketplace_rate_order', {
    p_order_id: parsed.data.orderId,
    p_score: parsed.data.score,
    p_comment: parsed.data.comment ?? null,
  });
}
