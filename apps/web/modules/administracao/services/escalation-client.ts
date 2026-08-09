/**
 * Operational escalations — Supervisor → Admin → Super → Founder.
 */

import { createBrowserClient } from '@/lib/supabase/client';

export type EscalationTarget = 'administrator' | 'super_administrator' | 'founder';
export type EscalationPriority = 'low' | 'normal' | 'high' | 'critical';
export type EscalationStatus = 'open' | 'acknowledged' | 'resolved' | 'cancelled';

export type OperationalEscalation = {
  id: string;
  created_by: string;
  created_by_role: string;
  target_level: EscalationTarget;
  assignee_id: string | null;
  property_id: string | null;
  review_id: string | null;
  priority: EscalationPriority;
  reason: string;
  status: EscalationStatus;
  due_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  created_by_name?: string | null;
  property_title?: string | null;
};

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; message: string };
type Result<T> = Ok<T> | Err;

function fail(message: string): Err {
  return { ok: false, message };
}

export async function listOperationalEscalations(
  limit = 50,
): Promise<Result<OperationalEscalation[]>> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('list_operational_escalations', {
      p_limit: limit,
    });
    if (error) return fail(error.message);
    return { ok: true, data: (data ?? []) as OperationalEscalation[] };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Falha ao listar escalações');
  }
}

export async function createOperationalEscalation(input: {
  targetLevel: EscalationTarget;
  reason: string;
  priority?: EscalationPriority;
  propertyId?: string | null;
  reviewId?: string | null;
  dueHours?: number;
}): Promise<Result<OperationalEscalation>> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('create_operational_escalation', {
      p_target_level: input.targetLevel,
      p_reason: input.reason,
      p_priority: input.priority ?? 'normal',
      p_property_id: input.propertyId ?? null,
      p_review_id: input.reviewId ?? null,
      p_due_hours: input.dueHours ?? 12,
    });
    if (error) return fail(error.message);
    return { ok: true, data: data as OperationalEscalation };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Falha ao criar escalação');
  }
}

export async function resolveOperationalEscalation(input: {
  escalationId: string;
  status: 'acknowledged' | 'resolved' | 'cancelled';
  resolutionNotes?: string;
}): Promise<Result<OperationalEscalation>> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('resolve_operational_escalation', {
      p_escalation_id: input.escalationId,
      p_status: input.status,
      p_resolution_notes: input.resolutionNotes ?? null,
    });
    if (error) return fail(error.message);
    return { ok: true, data: data as OperationalEscalation };
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Falha ao actualizar escalação');
  }
}

export const ESCALATION_TARGET_LABELS: Record<EscalationTarget, string> = {
  administrator: 'Administrador',
  super_administrator: 'Super Admin',
  founder: 'Founder',
};

export const ESCALATION_PRIORITY_LABELS: Record<EscalationPriority, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  critical: 'Crítica',
};
