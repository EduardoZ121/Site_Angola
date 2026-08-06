'use client';

import {
  smartMoveCancelSchema,
  smartMoveCreateSchema,
  smartMoveFailSchema,
  smartMoveMatchSchema,
  smartMoveRejectSchema,
  smartMoveRequestIdSchema,
  type SmartMoveCancelInput,
  type SmartMoveCreateInput,
  type SmartMoveFailInput,
  type SmartMoveMatchInput,
  type SmartMoveRejectInput,
  type SmartMoveRequestIdInput,
} from '@kuteka/validation';
import { createBrowserClient } from '@/lib/supabase/client';
import { mapIdentityGateMessage } from '@/modules/identidade/lib/map-identity-gate';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { getMonetizationCopy } from '../content';

/**
 * Mudança Inteligente N5 (Fase D1).
 *
 * Fecha o ciclo draft → awaiting_payment → active → matched →
 * completed | cancelled | failed reutilizando a MESMA infraestrutura financeira
 * (Ledger + Kuteka Pay + reembolsos/créditos). Abertura cobrada no arranque;
 * sucesso cobrado APENAS quando a Kuteka encontra solução aceite; reembolso em
 * créditos por urgência quando falha o SLA. Nenhum caminho de pagamento isolado.
 */

function copy() {
  const locale = resolveUiLocale();
  const monetization = getMonetizationCopy(locale);
  return {
    loadError: monetization.smartMove.loadError,
    actionError: monetization.common.actionError,
    locale,
  };
}

export type SmartMoveRequestDetail = {
  id: string;
  client_id: string;
  contract_id: string | null;
  property_id: string | null;
  urgency_band: string;
  target_exit_on: string;
  status: string;
  preferences: Record<string, unknown>;
  opening_amount_aoa: number | null;
  success_amount_aoa: number | null;
  opening_payment_intent_id: string | null;
  success_payment_intent_id: string | null;
  success_charged_at: string | null;
  matched_property_id: string | null;
  match_notes: string | null;
  accepted_match: boolean;
  sla_hours: number | null;
  sla_due_at: string | null;
  sla_breached: boolean;
  matched_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  cancelled_at: string | null;
  failure_reason: string | null;
  kai_notes: string | null;
  partner_notified_at: string | null;
  agent_task_created_at: string | null;
  created_at: string;
};

export type SmartMoveEvent = {
  id: string;
  request_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string;
};

export type SmartMoveContext = {
  canOperate: boolean;
};

const REQUEST_SELECT =
  'id,client_id,contract_id,property_id,urgency_band,target_exit_on,status,preferences,opening_amount_aoa,success_amount_aoa,opening_payment_intent_id,success_payment_intent_id,success_charged_at,matched_property_id,match_notes,accepted_match,sla_hours,sla_due_at,sla_breached,matched_at,completed_at,failed_at,cancelled_at,failure_reason,kai_notes,partner_notified_at,agent_task_created_at,created_at';

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

export async function fetchSmartMoveContext(): Promise<
  { ok: true; data: SmartMoveContext } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('smart_move_my_context');
    if (error || !data) return { ok: false, message: error?.message || copy().loadError };
    const raw = data as { canOperate?: boolean };
    return { ok: true, data: { canOperate: Boolean(raw.canOperate) } };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

export async function listSmartMoveRequests(): Promise<
  { ok: true; data: SmartMoveRequestDetail[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('smart_move_requests')
      .select(REQUEST_SELECT)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) return { ok: false, message: error.message || copy().loadError };
    return { ok: true, data: (data ?? []) as SmartMoveRequestDetail[] };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

export async function listSmartMoveEvents(
  requestId: string,
): Promise<{ ok: true; data: SmartMoveEvent[] } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('smart_move_events')
      .select('id,request_id,event_type,from_status,to_status,note,created_at')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })
      .limit(50);
    if (error) return { ok: false, message: error.message || copy().loadError };
    return { ok: true, data: (data ?? []) as SmartMoveEvent[] };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

export async function createSmartMoveRequest(input: SmartMoveCreateInput): Promise<ActionResult> {
  const parsed = smartMoveCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy().actionError };
  }
  return callRpc('create_smart_move_request', {
    p_urgency_band: parsed.data.urgencyBand,
    p_target_exit_on: parsed.data.targetExitOn,
    p_contract_id: parsed.data.contractId ?? null,
    p_preferences: parsed.data.preferences ?? {},
  });
}

export async function matchSmartMove(input: SmartMoveMatchInput): Promise<ActionResult> {
  const parsed = smartMoveMatchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy().actionError };
  }
  return callRpc('smart_move_match', {
    p_request_id: parsed.data.requestId,
    p_matched_property_id: parsed.data.matchedPropertyId ?? null,
    p_notes: parsed.data.notes ?? null,
  });
}

export async function acceptSmartMoveMatch(input: SmartMoveRequestIdInput): Promise<ActionResult> {
  const parsed = smartMoveRequestIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy().actionError };
  return callRpc('smart_move_accept_match', { p_request_id: parsed.data.requestId });
}

export async function rejectSmartMoveMatch(input: SmartMoveRejectInput): Promise<ActionResult> {
  const parsed = smartMoveRejectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy().actionError };
  return callRpc('smart_move_reject_match', {
    p_request_id: parsed.data.requestId,
    p_reason: parsed.data.reason ?? null,
  });
}

export async function failSmartMove(input: SmartMoveFailInput): Promise<ActionResult> {
  const parsed = smartMoveFailSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy().actionError };
  return callRpc('smart_move_fail', {
    p_request_id: parsed.data.requestId,
    p_reason: parsed.data.reason ?? null,
  });
}

export async function cancelSmartMove(input: SmartMoveCancelInput): Promise<ActionResult> {
  const parsed = smartMoveCancelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy().actionError };
  return callRpc('smart_move_cancel', {
    p_request_id: parsed.data.requestId,
    p_reason: parsed.data.reason ?? null,
  });
}
