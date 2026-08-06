'use client';

import {
  findHomeCancelSchema,
  findHomeCreateSchema,
  findHomeFailSchema,
  findHomeMatchSchema,
  findHomeRejectSchema,
  findHomeRequestIdSchema,
  type FindHomeCancelInput,
  type FindHomeCreateInput,
  type FindHomeFailInput,
  type FindHomeMatchInput,
  type FindHomeRejectInput,
  type FindHomeRequestIdInput,
} from '@kuteka/validation';
import { createBrowserClient } from '@/lib/supabase/client';
import { mapIdentityGateMessage } from '@/modules/identidade/lib/map-identity-gate';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { getMonetizationCopy } from '../content';

/**
 * Encontrar Casa D2 — procura prioritária sobre Ledger + Kuteka Pay.
 * Uma só taxa (priority_fee). Sem caminho de pagamento isolado.
 */

function copy() {
  const locale = resolveUiLocale();
  const monetization = getMonetizationCopy(locale);
  return {
    loadError: monetization.findHome.loadError,
    actionError: monetization.common.actionError,
    locale,
  };
}

export type FindHomeRequestDetail = {
  id: string;
  client_id: string;
  province: string | null;
  municipality: string | null;
  typology: string | null;
  budget_max_aoa: number | null;
  preferences: Record<string, unknown>;
  status: string;
  payment_intent_id: string | null;
  priority_amount_aoa: number | null;
  matched_property_id: string | null;
  match_notes: string | null;
  accepted_match: boolean;
  sla_hours: number | null;
  sla_due_at: string | null;
  sla_breached: boolean;
  kai_notes: string | null;
  matched_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  cancelled_at: string | null;
  failure_reason: string | null;
  created_at: string;
};

export type FindHomeEvent = {
  id: string;
  request_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  note: string | null;
  created_at: string;
};

export type FindHomeContext = {
  canOperate: boolean;
};

const REQUEST_SELECT =
  'id,client_id,province,municipality,typology,budget_max_aoa,preferences,status,payment_intent_id,priority_amount_aoa,matched_property_id,match_notes,accepted_match,sla_hours,sla_due_at,sla_breached,kai_notes,matched_at,completed_at,failed_at,cancelled_at,failure_reason,created_at';

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

export async function fetchFindHomeContext(): Promise<
  { ok: true; data: FindHomeContext } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('find_home_my_context');
    if (error || !data) return { ok: false, message: error?.message || copy().loadError };
    const raw = data as { canOperate?: boolean };
    return { ok: true, data: { canOperate: Boolean(raw.canOperate) } };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

export async function listFindHomeRequests(): Promise<
  { ok: true; data: FindHomeRequestDetail[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('find_home_requests')
      .select(REQUEST_SELECT)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) return { ok: false, message: error.message || copy().loadError };
    return { ok: true, data: (data ?? []) as FindHomeRequestDetail[] };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

export async function listFindHomeEvents(
  requestId: string,
): Promise<{ ok: true; data: FindHomeEvent[] } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('find_home_events')
      .select('id,request_id,event_type,from_status,to_status,note,created_at')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })
      .limit(50);
    if (error) return { ok: false, message: error.message || copy().loadError };
    return { ok: true, data: (data ?? []) as FindHomeEvent[] };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

export async function createFindHomeRequest(input: FindHomeCreateInput): Promise<ActionResult> {
  const parsed = findHomeCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy().actionError };
  }
  return callRpc('create_find_home_request', {
    p_province: parsed.data.province ?? null,
    p_municipality: parsed.data.municipality ?? null,
    p_typology: parsed.data.typology ?? null,
    p_budget_max: parsed.data.budgetMax ?? null,
    p_notes: parsed.data.notes ?? null,
    p_preferences: parsed.data.preferences ?? {},
  });
}

export async function matchFindHome(input: FindHomeMatchInput): Promise<ActionResult> {
  const parsed = findHomeMatchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy().actionError };
  }
  return callRpc('find_home_match', {
    p_request_id: parsed.data.requestId,
    p_matched_property_id: parsed.data.matchedPropertyId ?? null,
    p_notes: parsed.data.notes ?? null,
  });
}

export async function acceptFindHomeMatch(input: FindHomeRequestIdInput): Promise<ActionResult> {
  const parsed = findHomeRequestIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy().actionError };
  return callRpc('find_home_accept_match', { p_request_id: parsed.data.requestId });
}

export async function rejectFindHomeMatch(input: FindHomeRejectInput): Promise<ActionResult> {
  const parsed = findHomeRejectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy().actionError };
  return callRpc('find_home_reject_match', {
    p_request_id: parsed.data.requestId,
    p_reason: parsed.data.reason ?? null,
  });
}

export async function failFindHome(input: FindHomeFailInput): Promise<ActionResult> {
  const parsed = findHomeFailSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy().actionError };
  return callRpc('find_home_fail', {
    p_request_id: parsed.data.requestId,
    p_reason: parsed.data.reason ?? null,
  });
}

export async function cancelFindHome(input: FindHomeCancelInput): Promise<ActionResult> {
  const parsed = findHomeCancelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: copy().actionError };
  return callRpc('find_home_cancel', {
    p_request_id: parsed.data.requestId,
    p_reason: parsed.data.reason ?? null,
  });
}
