import { z } from 'zod';
import { FINANCE_URGENCY_BANDS } from './finance';

/**
 * Fase D1 — Mudança Inteligente N5.
 *
 * Máquina de estados de um pedido:
 * draft → awaiting_payment → active → matched → completed
 *   · matched → accept (cobra sucesso) → completed
 *   · matched → reject → active
 *   · active|matched → fail (reembolso por urgência)
 *   · draft|awaiting_payment|active → cancel (reembolso integral)
 *
 * Pagamentos SEMPRE pelo motor unificado Kuteka Pay (nenhum caminho isolado):
 *   · abertura (opening_fee) no arranque · sucesso (success_fee) só quando aceite.
 */
export const SMART_MOVE_STATUSES = [
  'draft',
  'awaiting_payment',
  'active',
  'matched',
  'completed',
  'cancelled',
  'failed',
] as const;

export type SmartMoveStatus = (typeof SMART_MOVE_STATUSES)[number];

export const SMART_MOVE_EVENT_TYPES = [
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

export type SmartMoveEventType = (typeof SMART_MOVE_EVENT_TYPES)[number];

export const smartMoveCreateSchema = z.object({
  urgencyBand: z.enum(FINANCE_URGENCY_BANDS),
  targetExitOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  contractId: z.string().uuid().optional().nullable(),
  preferences: z.record(z.unknown()).optional(),
});

export const smartMoveRequestIdSchema = z.object({
  requestId: z.string().uuid(),
});

export const smartMoveMatchSchema = z.object({
  requestId: z.string().uuid(),
  matchedPropertyId: z.string().uuid().optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const smartMoveRejectSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().trim().max(500).optional().nullable(),
});

export const smartMoveFailSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().trim().max(500).optional().nullable(),
});

export const smartMoveCancelSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().trim().max(500).optional().nullable(),
});

export type SmartMoveCreateInput = z.infer<typeof smartMoveCreateSchema>;
export type SmartMoveRequestIdInput = z.infer<typeof smartMoveRequestIdSchema>;
export type SmartMoveMatchInput = z.infer<typeof smartMoveMatchSchema>;
export type SmartMoveRejectInput = z.infer<typeof smartMoveRejectSchema>;
export type SmartMoveFailInput = z.infer<typeof smartMoveFailSchema>;
export type SmartMoveCancelInput = z.infer<typeof smartMoveCancelSchema>;
