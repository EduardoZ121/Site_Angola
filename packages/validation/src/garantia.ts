import { z } from 'zod';

/** Fase D4 — Garantia Kuteka. */
export const GARANTIA_STATUSES = [
  'draft',
  'awaiting_payment',
  'active',
  'cancelled',
  'past_due',
  'failed',
] as const;

export type GarantiaStatus = (typeof GARANTIA_STATUSES)[number];

export const GARANTIA_EVENT_TYPES = [
  'created',
  'payment_requested',
  'activated',
  'cancelled',
  'past_due',
  'failed',
  'refunded',
  'note',
] as const;

export type GarantiaEventType = (typeof GARANTIA_EVENT_TYPES)[number];

export const garantiaCreateSchema = z.object({
  propertyId: z.string().uuid().optional().nullable(),
  contractId: z.string().uuid().optional().nullable(),
});

export const garantiaSubscriptionIdSchema = z.object({
  subscriptionId: z.string().uuid(),
});

export const garantiaCancelSchema = garantiaSubscriptionIdSchema.extend({
  reason: z.string().trim().max(500).optional().nullable(),
});

export const garantiaPaymentStatusSchema = garantiaSubscriptionIdSchema.extend({
  status: z.enum(['past_due', 'failed']),
  reason: z.string().trim().max(500).optional().nullable(),
});

export type GarantiaCreateInput = z.infer<typeof garantiaCreateSchema>;
export type GarantiaSubscriptionIdInput = z.infer<typeof garantiaSubscriptionIdSchema>;
export type GarantiaCancelInput = z.infer<typeof garantiaCancelSchema>;
export type GarantiaPaymentStatusInput = z.infer<typeof garantiaPaymentStatusSchema>;
