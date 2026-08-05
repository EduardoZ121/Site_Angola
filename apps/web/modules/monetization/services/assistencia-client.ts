'use client';

import {
  assistenciaCancelSchema,
  assistenciaCreateSchema,
  assistenciaFailSchema,
  assistenciaOperatorActionSchema,
  assistenciaRequestIdSchema,
  type AssistenciaCancelInput,
  type AssistenciaCreateInput,
  type AssistenciaFailInput,
  type AssistenciaOperatorActionInput,
  type AssistenciaRequestIdInput,
} from '@kuteka/validation';
import { createBrowserClient } from '@/lib/supabase/client';
import { mapIdentityGateMessage } from '@/modules/identidade/lib/map-identity-gate';

const copy = {
  loadError: 'Não foi possível carregar os pedidos de Assistência 24h.',
  actionError: 'Não foi possível concluir a acção.',
};

export type AssistenciaRequestDetail = {
  id: string;
  client_id: string;
  category: string;
  urgency: string;
  notes: string;
  property_id: string | null;
  status: string;
  payment_intent_id: string | null;
  call_fee_aoa: number | null;
  operator_id: string | null;
  operator_notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  created_at: string;
};

export type AssistenciaEvent = {
  id: string;
  request_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string;
};

export type AssistenciaContext = { canOperate: boolean };

const REQUEST_SELECT =
  'id,client_id,category,urgency,notes,property_id,status,payment_intent_id,call_fee_aoa,operator_id,operator_notes,started_at,completed_at,cancelled_at,failed_at,failure_reason,created_at';

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

export async function fetchAssistenciaContext(): Promise<
  { ok: true; data: AssistenciaContext } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('assistencia_my_context');
    if (error || !data) return { ok: false, message: error?.message || copy.loadError };
    const raw = data as { canOperate?: boolean };
    return { ok: true, data: { canOperate: Boolean(raw.canOperate) } };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listAssistenciaRequests(): Promise<
  { ok: true; data: AssistenciaRequestDetail[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('assistencia_requests')
      .select(REQUEST_SELECT)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) return { ok: false, message: error.message || copy.loadError };
    return { ok: true, data: (data ?? []) as AssistenciaRequestDetail[] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listAssistenciaEvents(
  requestId: string,
): Promise<{ ok: true; data: AssistenciaEvent[] } | { ok: false; message: string }> {
  const parsed = assistenciaRequestIdSchema.safeParse({ requestId });
  if (!parsed.success) return { ok: false, message: copy.actionError };
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('assistencia_events')
      .select('id,request_id,event_type,from_status,to_status,note,created_at')
      .eq('request_id', parsed.data.requestId)
      .order('created_at', { ascending: true })
      .limit(50);
    if (error) return { ok: false, message: error.message || copy.loadError };
    return { ok: true, data: (data ?? []) as AssistenciaEvent[] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function createAssistenciaRequest(
  input: AssistenciaCreateInput,
): Promise<ActionResult> {
  const parsed = assistenciaCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.actionError };
  }
  return callRpc('create_assistencia_request', {
    p_category: parsed.data.category,
    p_urgency: parsed.data.urgency,
    p_notes: parsed.data.notes,
    p_property_id: parsed.data.propertyId ?? null,
  });
}

export async function activateAssistencia(input: AssistenciaRequestIdInput): Promise<ActionResult> {
  const parsed = assistenciaRequestIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy.actionError };
  return callRpc('assistencia_activate', { p_request_id: parsed.data.requestId });
}

export async function startAssistencia(
  input: AssistenciaOperatorActionInput,
): Promise<ActionResult> {
  const parsed = assistenciaOperatorActionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy.actionError };
  return callRpc('assistencia_start', {
    p_request_id: parsed.data.requestId,
    p_note: parsed.data.note ?? null,
  });
}

export async function completeAssistencia(
  input: AssistenciaOperatorActionInput,
): Promise<ActionResult> {
  const parsed = assistenciaOperatorActionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy.actionError };
  return callRpc('assistencia_complete', {
    p_request_id: parsed.data.requestId,
    p_note: parsed.data.note ?? null,
  });
}

export async function cancelAssistencia(input: AssistenciaCancelInput): Promise<ActionResult> {
  const parsed = assistenciaCancelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy.actionError };
  return callRpc('assistencia_cancel', {
    p_request_id: parsed.data.requestId,
    p_reason: parsed.data.reason ?? null,
  });
}

export async function failAssistencia(input: AssistenciaFailInput): Promise<ActionResult> {
  const parsed = assistenciaFailSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy.actionError };
  return callRpc('assistencia_fail', {
    p_request_id: parsed.data.requestId,
    p_reason: parsed.data.reason ?? null,
  });
}
