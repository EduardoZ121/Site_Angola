import { z } from 'zod';

/**
 * Fase D2 — Encontrar Casa (procura prioritária pay-per-use).
 *
 * Máquina de estados de um pedido:
 * draft → awaiting_payment → active → matched → completed
 *   · matched → accept (sem taxa adicional) → completed
 *   · matched → reject → active
 *   · active|matched → fail (reembolso integral) → failed
 *   · draft|awaiting_payment|active → cancel (reembolso integral) → cancelled
 *
 * Pagamento SEMPRE pelo motor unificado Kuteka Pay (nenhum caminho isolado):
 *   · uma única taxa de prioridade (priority_fee) cobrada no arranque.
 */
export const FIND_HOME_STATUSES = [
  'draft',
  'awaiting_payment',
  'active',
  'matched',
  'completed',
  'cancelled',
  'failed',
] as const;

export type FindHomeStatus = (typeof FIND_HOME_STATUSES)[number];

export const FIND_HOME_EVENT_TYPES = [
  'created',
  'activated',
  'matched',
  'accepted',
  'rejected',
  'completed',
  'cancelled',
  'failed',
  'refunded',
  'sla_breached',
  'note',
] as const;

export type FindHomeEventType = (typeof FIND_HOME_EVENT_TYPES)[number];

export const FIND_HOME_TYPOLOGIES = [
  't0',
  't1',
  't2',
  't3',
  't4',
  't5_plus',
  'moradia',
  'terreno',
  'comercial',
  'outro',
] as const;

export type FindHomeTypology = (typeof FIND_HOME_TYPOLOGIES)[number];

export const findHomeCreateSchema = z.object({
  province: z.string().trim().min(2).max(120).optional().nullable(),
  municipality: z.string().trim().min(2).max(120).optional().nullable(),
  typology: z.enum(FIND_HOME_TYPOLOGIES).optional().nullable(),
  budgetMax: z.number().positive().max(10_000_000_000).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  preferences: z.record(z.unknown()).optional(),
});

export const findHomeRequestIdSchema = z.object({
  requestId: z.string().uuid(),
});

export const findHomeMatchSchema = z.object({
  requestId: z.string().uuid(),
  matchedPropertyId: z.string().uuid().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const findHomeRejectSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().trim().max(500).optional().nullable(),
});

export const findHomeFailSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().trim().max(500).optional().nullable(),
});

export const findHomeCancelSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().trim().max(500).optional().nullable(),
});

export type FindHomeCreateInput = z.infer<typeof findHomeCreateSchema>;
export type FindHomeRequestIdInput = z.infer<typeof findHomeRequestIdSchema>;
export type FindHomeMatchInput = z.infer<typeof findHomeMatchSchema>;
export type FindHomeRejectInput = z.infer<typeof findHomeRejectSchema>;
export type FindHomeFailInput = z.infer<typeof findHomeFailSchema>;
export type FindHomeCancelInput = z.infer<typeof findHomeCancelSchema>;
