'use client';

import {
  conciergeCancelSchema,
  conciergeCreateSchema,
  conciergeFailSchema,
  conciergeOperatorActionSchema,
  type ConciergeCancelInput,
  type ConciergeCreateInput,
  type ConciergeFailInput,
  type ConciergeOperatorActionInput,
} from '@kuteka/validation';
import { createBrowserClient } from '@/lib/supabase/client';

const copy = {
  loadError: 'Não foi possível carregar os pedidos Concierge.',
  actionError: 'Não foi possível concluir a acção.',
};

export type ConciergeRequestDetail = {
  id: string;
  client_id: string;
  category: string;
  notes: string;
  property_id: string | null;
  contract_id: string | null;
  status: string;
  payment_intent_id: string | null;
  service_fee_aoa: number | null;
  operator_id: string | null;
  operator_notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  created_at: string;
};

export type ConciergeEvent = {
  id: string;
  request_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string;
};

export type ConciergeContext = {
  canOperate: boolean;
};

const REQUEST_SELECT =
  'id,client_id,category,notes,property_id,contract_id,status,payment_intent_id,service_fee_aoa,operator_id,operator_notes,started_at,completed_at,cancelled_at,failed_at,failure_reason,created_at';

type ActionResult = { ok: true; data: Record<string, unknown> } | { ok: false; message: string };

async function callRpc(fn: string, args: Record<string, unknown>): Promise<ActionResult> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc(fn, args);
    if (error || !data) return { ok: false, message: error?.message || copy.actionError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy.actionError };
  }
}

export async function fetchConciergeContext(): Promise<
  { ok: true; data: ConciergeContext } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('concierge_my_context');
    if (error || !data) return { ok: false, message: error?.message || copy.loadError };
    const raw = data as { canOperate?: boolean };
    return { ok: true, data: { canOperate: Boolean(raw.canOperate) } };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listConciergeRequests(): Promise<
  { ok: true; data: ConciergeRequestDetail[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('concierge_requests')
      .select(REQUEST_SELECT)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) return { ok: false, message: error.message || copy.loadError };
    return { ok: true, data: (data ?? []) as ConciergeRequestDetail[] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listConciergeEvents(
  requestId: string,
): Promise<{ ok: true; data: ConciergeEvent[] } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('concierge_events')
      .select('id,request_id,event_type,from_status,to_status,note,created_at')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })
      .limit(50);
    if (error) return { ok: false, message: error.message || copy.loadError };
    return { ok: true, data: (data ?? []) as ConciergeEvent[] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function createConciergeRequest(input: ConciergeCreateInput): Promise<ActionResult> {
  const parsed = conciergeCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.actionError };
  }
  return callRpc('create_concierge_request', {
    p_category: parsed.data.category,
    p_notes: parsed.data.notes,
    p_property_id: parsed.data.propertyId ?? null,
    p_contract_id: parsed.data.contractId ?? null,
  });
}

export async function startConcierge(input: ConciergeOperatorActionInput): Promise<ActionResult> {
  const parsed = conciergeOperatorActionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy.actionError };
  return callRpc('concierge_start', {
    p_request_id: parsed.data.requestId,
    p_note: parsed.data.note ?? null,
  });
}

export async function completeConcierge(
  input: ConciergeOperatorActionInput,
): Promise<ActionResult> {
  const parsed = conciergeOperatorActionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy.actionError };
  return callRpc('concierge_complete', {
    p_request_id: parsed.data.requestId,
    p_note: parsed.data.note ?? null,
  });
}

export async function cancelConcierge(input: ConciergeCancelInput): Promise<ActionResult> {
  const parsed = conciergeCancelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy.actionError };
  return callRpc('concierge_cancel', {
    p_request_id: parsed.data.requestId,
    p_reason: parsed.data.reason ?? null,
  });
}

export async function failConcierge(input: ConciergeFailInput): Promise<ActionResult> {
  const parsed = conciergeFailSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy.actionError };
  return callRpc('concierge_fail', {
    p_request_id: parsed.data.requestId,
    p_reason: parsed.data.reason ?? null,
  });
}
