import { z } from 'zod';

/**
 * Fase D3 — Concierge Kuteka.
 *
 * draft → awaiting_payment → active → in_progress → completed
 * active|in_progress → failed
 * draft|awaiting_payment|active → cancelled (reembolso integral)
 */
export const CONCIERGE_STATUSES = [
  'draft',
  'awaiting_payment',
  'active',
  'in_progress',
  'completed',
  'cancelled',
  'failed',
] as const;

export type ConciergeStatus = (typeof CONCIERGE_STATUSES)[number];

export const CONCIERGE_EVENT_TYPES = [
  'created',
  'activated',
  'started',
  'completed',
  'cancelled',
  'failed',
  'refunded',
  'note',
] as const;

export type ConciergeEventType = (typeof CONCIERGE_EVENT_TYPES)[number];

export const CONCIERGE_CATEGORIES = [
  'housing_guidance',
  'contract_support',
  'document_support',
  'move_coordination',
  'property_support',
  'other',
] as const;

export type ConciergeCategory = (typeof CONCIERGE_CATEGORIES)[number];

export const conciergeCreateSchema = z.object({
  category: z.enum(CONCIERGE_CATEGORIES),
  notes: z.string().trim().min(10).max(2000),
  propertyId: z.string().uuid().optional().nullable(),
  contractId: z.string().uuid().optional().nullable(),
});

export const conciergeRequestIdSchema = z.object({
  requestId: z.string().uuid(),
});

export const conciergeOperatorActionSchema = conciergeRequestIdSchema.extend({
  note: z.string().trim().max(1000).optional().nullable(),
});

export const conciergeCancelSchema = conciergeRequestIdSchema.extend({
  reason: z.string().trim().max(500).optional().nullable(),
});

export const conciergeFailSchema = conciergeRequestIdSchema.extend({
  reason: z.string().trim().max(500).optional().nullable(),
});

export type ConciergeCreateInput = z.infer<typeof conciergeCreateSchema>;
export type ConciergeRequestIdInput = z.infer<typeof conciergeRequestIdSchema>;
export type ConciergeOperatorActionInput = z.infer<typeof conciergeOperatorActionSchema>;
export type ConciergeCancelInput = z.infer<typeof conciergeCancelSchema>;
export type ConciergeFailInput = z.infer<typeof conciergeFailSchema>;
