import { z } from 'zod';

/**
 * Fase C — Marketplace operacional.
 *
 * Máquina de estados de um pedido de serviço:
 * requested → quoted → accepted → in_progress → completed
 *   (completed → pago via Kuteka Pay → avaliado)
 * Qualquer estado não terminal → cancelled. disputed é reservado para litígios.
 */
export const MARKETPLACE_ORDER_STATUSES = [
  'requested',
  'quoted',
  'accepted',
  'in_progress',
  'completed',
  'cancelled',
  'disputed',
] as const;

export type MarketplaceOrderStatus = (typeof MARKETPLACE_ORDER_STATUSES)[number];

export const MARKETPLACE_PROVIDER_CATEGORIES = [
  'cleaning',
  'moving',
  'painting',
  'plumbing',
  'electricity',
  'gardening',
  'security',
  'renovation',
  'internet',
  'insurance',
  'other',
] as const;

export const marketplaceCreateOrderSchema = z.object({
  providerId: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  category: z.string().trim().max(40).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  propertyId: z.string().uuid().optional().nullable(),
  slaHours: z.number().int().min(1).max(720).default(48),
});

export const marketplaceSubmitQuoteSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive().max(100_000_000),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const marketplaceOrderIdSchema = z.object({
  orderId: z.string().uuid(),
});

export const marketplacePayOrderSchema = z.object({
  orderId: z.string().uuid(),
  gatewayCode: z.literal('sandbox').default('sandbox'),
});

export const marketplaceCancelOrderSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().trim().max(500).optional().nullable(),
});

export const marketplaceRateOrderSchema = z.object({
  orderId: z.string().uuid(),
  score: z.number().min(1).max(5),
  comment: z.string().trim().max(500).optional().nullable(),
});

export type MarketplaceCreateOrderInput = z.infer<typeof marketplaceCreateOrderSchema>;
export type MarketplaceSubmitQuoteInput = z.infer<typeof marketplaceSubmitQuoteSchema>;
export type MarketplaceOrderIdInput = z.infer<typeof marketplaceOrderIdSchema>;
export type MarketplacePayOrderInput = z.infer<typeof marketplacePayOrderSchema>;
export type MarketplaceCancelOrderInput = z.infer<typeof marketplaceCancelOrderSchema>;
export type MarketplaceRateOrderInput = z.infer<typeof marketplaceRateOrderSchema>;
