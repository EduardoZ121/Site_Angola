import { z } from 'zod';

/** Fase D5 — Assistência 24h. */
export const ASSISTENCIA_STATUSES = [
  'draft',
  'awaiting_payment',
  'active',
  'in_progress',
  'completed',
  'cancelled',
  'failed',
] as const;

export type AssistenciaStatus = (typeof ASSISTENCIA_STATUSES)[number];

export const ASSISTENCIA_EVENT_TYPES = [
  'created',
  'payment_requested',
  'activated',
  'started',
  'completed',
  'cancelled',
  'failed',
  'refunded',
  'note',
] as const;

export type AssistenciaEventType = (typeof ASSISTENCIA_EVENT_TYPES)[number];

export const ASSISTENCIA_CATEGORIES = [
  'plumbing',
  'electricity',
  'locksmith',
  'security',
  'water_damage',
  'gas',
  'other',
] as const;

export type AssistenciaCategory = (typeof ASSISTENCIA_CATEGORIES)[number];

export const ASSISTENCIA_URGENCIES = ['urgent', 'emergency'] as const;

export type AssistenciaUrgency = (typeof ASSISTENCIA_URGENCIES)[number];

export const assistenciaCreateSchema = z.object({
  category: z.enum(ASSISTENCIA_CATEGORIES),
  urgency: z.enum(ASSISTENCIA_URGENCIES),
  notes: z.string().trim().min(10).max(2000),
  propertyId: z.string().uuid().optional().nullable(),
});

export const assistenciaRequestIdSchema = z.object({
  requestId: z.string().uuid(),
});

export const assistenciaOperatorActionSchema = assistenciaRequestIdSchema.extend({
  note: z.string().trim().max(1000).optional().nullable(),
});

export const assistenciaCancelSchema = assistenciaRequestIdSchema.extend({
  reason: z.string().trim().max(500).optional().nullable(),
});

export const assistenciaFailSchema = assistenciaRequestIdSchema.extend({
  reason: z.string().trim().max(500).optional().nullable(),
});

export type AssistenciaCreateInput = z.infer<typeof assistenciaCreateSchema>;
export type AssistenciaRequestIdInput = z.infer<typeof assistenciaRequestIdSchema>;
export type AssistenciaOperatorActionInput = z.infer<typeof assistenciaOperatorActionSchema>;
export type AssistenciaCancelInput = z.infer<typeof assistenciaCancelSchema>;
export type AssistenciaFailInput = z.infer<typeof assistenciaFailSchema>;
